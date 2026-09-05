import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkChemicalOverdoseSafety } from "@/lib/jacuzzi-calc";
import { checkAndCreateLowStockTask } from "@/lib/inventory-guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const latestWaterLog = await prisma.waterLog.findFirst({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
    });

    const now = Date.now();
    const lastTestTime = latestWaterLog?.testedAt ? new Date(latestWaterLog.testedAt).getTime() : 0;
    const daysSinceLastTest = lastTestTime ? (now - lastTestTime) / (1000 * 3600 * 24) : 999;

    // 🌟 Clean up any legacy initial test tasks
    await prisma.maintenanceTask.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: "ראשונית" } },
          { title: { contains: "בדיקת מקלון ראשונית" } },
        ],
      },
    });

    const tasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { nextDueDate: "asc" },
    });

    // Auto-heal tasks:
    for (const t of tasks) {
      const isWaterTask =
        t.title.includes("בדיקת מים") ||
        t.title.includes("מקלון") ||
        t.title.includes("איכות מים") ||
        t.title.includes("ראשונית למים") ||
        t.category === "WATER_TEST";

      const isOneTime =
        t.category === "CUSTOM" ||
        t.title.includes("ראשונית") ||
        t.title.includes("חוזרת") ||
        t.title.includes("מעקב") ||
        t.frequencyDays <= 1;

      const taskDueTime = new Date(t.nextDueDate).getTime();
      const isFutureTask = taskDueTime > now;

      // 🌟 If a future task was erroneously marked as completed, restore it as active!
      if (isFutureTask && t.isCompleted) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: { isCompleted: false },
        });
        t.isCompleted = false;
      }

      // If a past one-time task was tested on or after its due time, mark it done
      if (isWaterTask && isOneTime && !isFutureTask && !t.isCompleted && lastTestTime >= taskDueTime - 3600 * 1000) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: { isCompleted: true, lastDoneDate: latestWaterLog?.testedAt || new Date() },
        });
        t.isCompleted = true;
      }

      // If recurring water test routine task: ensure weekly cycle (7 days)
      if (isWaterTask && !isOneTime && !t.isCompleted) {
        const nextDate = new Date(Math.max(now + 3 * 24 * 3600 * 1000, (lastTestTime || now) + 7 * 24 * 3600 * 1000));
        if (t.frequencyDays < 7 || (daysSinceLastTest <= 4 && new Date(t.nextDueDate).getTime() < nextDate.getTime())) {
          await prisma.maintenanceTask.update({
            where: { id: t.id },
            data: { frequencyDays: 7, nextDueDate: nextDate },
          });
          t.frequencyDays = 7;
          t.nextDueDate = nextDate;
        }
      }
    }

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { title, description, category, frequencyDays, nextDueDate, lastDoneDate, priority } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "כותרת משימה היא שדה חובה" }, { status: 400 });
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        category: category || "CUSTOM",
        frequencyDays: frequencyDays ? parseInt(frequencyDays, 10) : 7,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : new Date(),
        lastDoneDate: lastDoneDate ? new Date(lastDoneDate) : null,
        priority: priority || "MEDIUM",
        isCompleted: false,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const {
      id,
      resetTask, // Reset completed task back to unperformed & restore inventory!
      isCompleted,
      markDoneAndReschedule,
      nextDueDate,
      lastDoneDate,
      title,
      description,
      priority,
      frequencyDays,
      category,
      valueBefore,
      valueAfter,
      amountAdded,
      chemicalUsed,
      chemicalInventoryId,
      deductAmount,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "מזהה משימה חסר" }, { status: 400 });
    }

    const existing = await prisma.maintenanceTask.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "משימה לא נמצאה" }, { status: 404 });
    }

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });
    const volumeLiters = jacuzzi?.volumeLiters || 1200;

    // === RESET / UNDO TASK COMPLETION ===
    if (resetTask) {
      // 1. Restore inventory quantity
      let restockedAmount = 0;
      const userChems = await prisma.chemicalInventory.findMany({
        where: { userId: user.id },
      });
      const fullTaskText = `${existing.title || ""} ${existing.description || ""} ${existing.lastChemicalUsed || ""} ${existing.lastAmountAdded || ""}`;

      if (existing.lastChemicalInventoryId && existing.lastDeductAmount && existing.lastDeductAmount > 0) {
        const chem = userChems.find((c) => c.id === existing.lastChemicalInventoryId);
        if (chem) {
          restockedAmount = existing.lastDeductAmount;
          await prisma.chemicalInventory.update({
            where: { id: chem.id },
            data: { quantity: chem.quantity + existing.lastDeductAmount },
          });
        }
      } else {
        for (const chem of userChems) {
          if (fullTaskText.includes(chem.name)) {
            const chemEscaped = chem.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regexPatterns = [
              new RegExp(`${chemEscaped}[^0-9]*(\\d+(\\.\\d+)?)`, "i"),
              new RegExp(`(\\d+(\\.\\d+)?)[^0-9]*${chemEscaped}`, "i"),
            ];

            for (const regex of regexPatterns) {
              const match = fullTaskText.match(regex);
              if (match) {
                const num = parseFloat(match[1] || match[2] || "0");
                if (num > 0 && num <= 5000) {
                  restockedAmount += num;
                  await prisma.chemicalInventory.update({
                    where: { id: chem.id },
                    data: { quantity: chem.quantity + num },
                  });
                  break;
                }
              }
            }
          }
        }
      }

      // 2. Remove corresponding diary entry
      await prisma.diaryEntry.deleteMany({
        where: {
          userId: user.id,
          title: `בוצע: ${existing.title}`,
        },
      });

      // 3. Reset task to unperformed
      const updated = await prisma.maintenanceTask.update({
        where: { id },
        data: {
          lastDoneDate: null,
          lastValueBefore: null,
          lastValueAfter: null,
          lastAmountAdded: null,
          lastChemicalUsed: null,
          lastChemicalInventoryId: null,
          lastDeductAmount: null,
          isCompleted: false,
          nextDueDate: new Date(), // Due now
        },
      });

      return NextResponse.json({
        success: true,
        reset: true,
        restockedAmount,
        task: updated,
      });
    }

    let updateData: any = {};
    let deductedChemicalName = "";
    let deductedInventoryId: string | null = null;
    let actualDeductNum: number | null = null;
    let safetyCheck = null;

    const actionDateObj = body.actionDate ? new Date(body.actionDate) : new Date();

    // Deduct chemical from inventory if selected
    if (markDoneAndReschedule && chemicalInventoryId && deductAmount && parseFloat(deductAmount) > 0) {
      const chem = await prisma.chemicalInventory.findFirst({
        where: { id: chemicalInventoryId, userId: user.id },
      });

      if (chem) {
        deductedChemicalName = chem.name;
        deductedInventoryId = chem.id;
        actualDeductNum = parseFloat(deductAmount);
        const newQuantity = Math.max(0, chem.quantity - actualDeductNum);

        const updatedChem = await prisma.chemicalInventory.update({
          where: { id: chem.id },
          data: {
            quantity: newQuantity,
            lastUsedDate: actionDateObj,
            lastUsedAmount: actualDeductNum,
          },
        });

        // Auto-create order task for today if stock dropped below 1/3
        await checkAndCreateLowStockTask(user.id, updatedChem);

        // Run overdose safety check
        safetyCheck = checkChemicalOverdoseSafety(chem.name, chem.category, actualDeductNum, volumeLiters);
      }
    } else if (markDoneAndReschedule && chemicalUsed && deductAmount) {
      actualDeductNum = parseFloat(deductAmount);
      safetyCheck = checkChemicalOverdoseSafety(chemicalUsed, "OTHER", actualDeductNum, volumeLiters);
    }

    if (markDoneAndReschedule) {
      const rawFreq = frequencyDays ? parseInt(frequencyDays, 10) : existing.frequencyDays;
      const isOneTime =
        existing.category === "CUSTOM" ||
        existing.title.includes("חוזרת") ||
        existing.title.includes("מעקב") ||
        rawFreq <= 1;

      const freq = isOneTime
        ? rawFreq
        : (existing.title.includes("בדיק") || existing.title.includes("מקלון") || existing.category === "WEEKLY" || existing.category === "WATER_TEST")
        ? Math.max(7, rawFreq || 7)
        : Math.max(1, rawFreq || 7);

      const nextDate = new Date(actionDateObj.getTime() + freq * 24 * 60 * 60 * 1000);

      const effectiveChemical = deductedChemicalName || chemicalUsed || null;
      const effectiveAmount = amountAdded || (actualDeductNum ? `${actualDeductNum} גרם/מ"ל` : null);

      updateData = {
        lastDoneDate: actionDateObj,
        nextDueDate: nextDate,
        frequencyDays: freq,
        isCompleted: isOneTime ? true : false,
        lastValueBefore: valueBefore || null,
        lastValueAfter: valueAfter || null,
        lastAmountAdded: effectiveAmount,
        lastChemicalUsed: effectiveChemical,
        lastChemicalInventoryId: deductedInventoryId || null,
        lastDeductAmount: actualDeductNum || null,
      };

      // Create / sync Diary record
      let detailedSummary = `בוצע טיפול: ${existing.title}.`;
      if (effectiveChemical) detailedSummary += `\n• חומר בשימוש: ${effectiveChemical} (${effectiveAmount || ""})`;
      if (valueBefore) detailedSummary += `\n• מדידה לפני הטיפול: ${valueBefore}`;
      if (valueAfter) detailedSummary += `\n• תוצאה ומדידה אחרי: ${valueAfter}`;
      if (notes) detailedSummary += `\n• הערות: ${notes}`;

      await prisma.diaryEntry.create({
        data: {
          userId: user.id,
          title: `בוצע: ${existing.title}`,
          content: detailedSummary,
          valueBefore: valueBefore || null,
          valueAfter: valueAfter || null,
          chemicalsAdded: effectiveChemical ? `${effectiveChemical}: ${effectiveAmount || ""}` : null,
          waterQualityRating: 5,
          entryDate: actionDateObj,
        },
      });

      // If this was a pipe flush / deep clean task, update jacuzzi.lastDeepCleanDate and lastRefillDate
      if (
        existing.title.includes("שטיפת צנרת") ||
        existing.title.includes("ניקוי צנרת") ||
        existing.title.includes("Flush")
      ) {
        await prisma.jacuzzi.updateMany({
          where: { userId: user.id },
          data: {
            lastDeepCleanDate: actionDateObj,
            lastRefillDate: actionDateObj,
          },
        });
      }

      // If this was a partial water refill task, update jacuzzi.lastRefillDate with weighted water age
      if (
        existing.title.includes("חלקית") ||
        (existing.title.includes("ריענון") && existing.title.includes("מים"))
      ) {
        if (jacuzzi?.lastRefillDate) {
          const oldRefill = new Date(jacuzzi.lastRefillDate).getTime();
          const currentWaterAgeDays = Math.max(0, Math.floor((actionDateObj.getTime() - oldRefill) / (1000 * 60 * 60 * 24)));
          // Weighted age after ~25% refill: age * 0.75
          const newAgeDays = Math.round(currentWaterAgeDays * 0.75);
          const newRefillDate = new Date(actionDateObj.getTime() - newAgeDays * 24 * 60 * 60 * 1000);
          await prisma.jacuzzi.updateMany({
            where: { userId: user.id },
            data: { lastRefillDate: newRefillDate },
          });
        }
      }
    } else {
      // General task editing
      if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
      if (nextDueDate !== undefined) updateData.nextDueDate = new Date(nextDueDate);
      if (lastDoneDate !== undefined) updateData.lastDoneDate = lastDoneDate ? new Date(lastDoneDate) : null;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (frequencyDays !== undefined) updateData.frequencyDays = parseInt(frequencyDays, 10);
      if (category !== undefined) updateData.category = category;
      if (valueBefore !== undefined) updateData.lastValueBefore = valueBefore;
      if (valueAfter !== undefined) updateData.lastValueAfter = valueAfter;
      if (amountAdded !== undefined) updateData.lastAmountAdded = amountAdded;
      if (chemicalUsed !== undefined) updateData.lastChemicalUsed = chemicalUsed;
      if (chemicalInventoryId !== undefined) updateData.lastChemicalInventoryId = chemicalInventoryId;
      if (deductAmount !== undefined) updateData.lastDeductAmount = parseFloat(deductAmount) || null;
    }

    const updated = await prisma.maintenanceTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      task: updated,
      safetyCheck: safetyCheck?.isOverdose ? safetyCheck : null,
    });
  } catch (error: any) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה משימה חסר" }, { status: 400 });
    }

    const existing = await prisma.maintenanceTask.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "משימה לא נמצאה" }, { status: 404 });
    }

    // 🌟 Always restore chemical inventory if chemical was deducted or referenced in this task
    const userChems = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    const fullTaskText = `${existing.title || ""} ${existing.description || ""} ${existing.lastChemicalUsed || ""} ${existing.lastAmountAdded || ""}`;

    if (existing.lastChemicalInventoryId && existing.lastDeductAmount && existing.lastDeductAmount > 0) {
      const chem = userChems.find((c) => c.id === existing.lastChemicalInventoryId);
      if (chem) {
        await prisma.chemicalInventory.update({
          where: { id: chem.id },
          data: { quantity: chem.quantity + existing.lastDeductAmount },
        });
      }
    } else {
      for (const chem of userChems) {
        if (fullTaskText.includes(chem.name)) {
          const chemEscaped = chem.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexPatterns = [
            new RegExp(`${chemEscaped}[^0-9]*(\\d+(\\.\\d+)?)`, "i"),
            new RegExp(`(\\d+(\\.\\d+)?)[^0-9]*${chemEscaped}`, "i"),
          ];

          let amountToRestore = 0;
          for (const regex of regexPatterns) {
            const match = fullTaskText.match(regex);
            if (match) {
              const num = parseFloat(match[1] || match[2] || "0");
              if (num > 0 && num <= 5000) {
                amountToRestore = num;
                break;
              }
            }
          }

          if (amountToRestore > 0) {
            await prisma.chemicalInventory.update({
              where: { id: chem.id },
              data: { quantity: chem.quantity + amountToRestore },
            });
          }
        }
      }
    }

    // 🌟 Delete corresponding diary entries with matching title or matching chemicals
    const diaryOrConditions: any[] = [
      { title: { contains: existing.title } },
      { content: { contains: existing.title } },
      { title: `בוצע: ${existing.title}` },
    ];

    for (const chem of userChems) {
      if (fullTaskText.includes(chem.name)) {
        diaryOrConditions.push({ title: { contains: chem.name } });
        diaryOrConditions.push({ content: { contains: chem.name } });
        diaryOrConditions.push({ chemicalsAdded: { contains: chem.name } });
      }
    }

    await prisma.diaryEntry.deleteMany({
      where: {
        userId: user.id,
        OR: diaryOrConditions,
      },
    });

    await prisma.maintenanceTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, restocked: true });
  } catch (error: any) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
