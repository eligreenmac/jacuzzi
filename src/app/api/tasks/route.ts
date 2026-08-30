import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkChemicalOverdoseSafety } from "@/lib/jacuzzi-calc";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const tasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { nextDueDate: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { title, description, category, frequencyDays, nextDueDate, priority } = await req.json();

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

    let updateData: any = {};
    let deductedChemicalName = "";
    let safetyCheck = null;

    // Deduct chemical from inventory if requested
    if (markDoneAndReschedule && chemicalInventoryId && deductAmount && parseFloat(deductAmount) > 0) {
      const chem = await prisma.chemicalInventory.findFirst({
        where: { id: chemicalInventoryId, userId: user.id },
      });

      if (chem) {
        deductedChemicalName = chem.name;
        const amountNum = parseFloat(deductAmount);
        const newQuantity = Math.max(0, chem.quantity - amountNum);

        await prisma.chemicalInventory.update({
          where: { id: chem.id },
          data: { quantity: newQuantity },
        });

        // Run overdose safety check
        safetyCheck = checkChemicalOverdoseSafety(chem.name, chem.category, amountNum, volumeLiters);
      }
    } else if (markDoneAndReschedule && chemicalUsed && deductAmount) {
      const amountNum = parseFloat(deductAmount);
      safetyCheck = checkChemicalOverdoseSafety(chemicalUsed, "OTHER", amountNum, volumeLiters);
    }

    if (markDoneAndReschedule) {
      const now = new Date();
      const freq = frequencyDays ? parseInt(frequencyDays, 10) : existing.frequencyDays;
      const nextDate = new Date(now.getTime() + freq * 24 * 60 * 60 * 1000);

      const effectiveChemical = deductedChemicalName || chemicalUsed || null;
      const effectiveAmount = amountAdded || (deductAmount ? `${deductAmount} גרם/מ"ל` : null);

      updateData = {
        lastDoneDate: now,
        nextDueDate: nextDate,
        isCompleted: false,
        lastValueBefore: valueBefore || null,
        lastValueAfter: valueAfter || null,
        lastAmountAdded: effectiveAmount,
        lastChemicalUsed: effectiveChemical,
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
        },
      });
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
    const restoreInventory = searchParams.get("restoreInventory") === "true";

    if (!id) {
      return NextResponse.json({ error: "מזהה משימה חסר" }, { status: 400 });
    }

    const existing = await prisma.maintenanceTask.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "משימה לא נמצאה" }, { status: 404 });
    }

    // If restoring inventory on task deletion
    if (restoreInventory && existing.lastChemicalUsed && existing.lastAmountAdded) {
      const numMatch = existing.lastAmountAdded.match(/(\d+(\.\d+)?)/);
      if (numMatch) {
        const amountToRestore = parseFloat(numMatch[0]);
        const chem = await prisma.chemicalInventory.findFirst({
          where: {
            userId: user.id,
            name: { contains: existing.lastChemicalUsed },
          },
        });
        if (chem) {
          await prisma.chemicalInventory.update({
            where: { id: chem.id },
            data: { quantity: chem.quantity + amountToRestore },
          });
        }
      }
    }

    // Delete corresponding diary entries with matching title
    await prisma.diaryEntry.deleteMany({
      where: {
        userId: user.id,
        title: `בוצע: ${existing.title}`,
      },
    });

    await prisma.maintenanceTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
