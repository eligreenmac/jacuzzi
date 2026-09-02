import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const {
      freeText,
      actionDate,
      scheduleShifts = [],
      newTasksToCreate = [],
      updateJacuzziRefill = false,
      suggestedDiaryTitle,
      suggestedDiaryContent,
    } = body;

    const actionDateObj = actionDate ? new Date(actionDate) : new Date();
    const textLower = (freeText || "").toLowerCase();

    // 0. Deduct used chemicals from chemical cabinet inventory and schedule recurring tasks if requested
    const chemicalsUsed = body.chemicalsUsed || [];
    const chemicalDeductionsSummary: string[] = [];
    if (Array.isArray(chemicalsUsed) && chemicalsUsed.length > 0) {
      for (const chemItem of chemicalsUsed) {
        if (chemItem.id && chemItem.amount > 0) {
          const chemical = await prisma.chemicalInventory.findFirst({
            where: { id: chemItem.id, userId: user.id },
          });
          if (chemical) {
            const newQuantity = Math.max(0, (chemical.quantity || 0) - chemItem.amount);
            await prisma.chemicalInventory.update({
              where: { id: chemItem.id },
              data: {
                quantity: newQuantity,
                lastUsedDate: actionDateObj,
                lastUsedAmount: chemItem.amount,
              },
            });
            const repeatText = chemItem.repeatDays && chemItem.repeatDays > 0 ? ` (חזרה כל ${chemItem.repeatDays} ימים)` : "";
            chemicalDeductionsSummary.push(`${chemical.name} (${chemItem.amount} ${chemItem.unit || chemical.unit || "גרם"}${repeatText})`);

            // If user requested recurring scheduling for this chemical:
            if (chemItem.repeatDays && chemItem.repeatDays > 0) {
              const repeatDaysNum = parseInt(chemItem.repeatDays, 10);
              const nextDue = new Date(actionDateObj.getTime() + repeatDaysNum * 24 * 3600 * 1000);
              const taskCategory = repeatDaysNum <= 7 ? "WEEKLY" : (repeatDaysNum <= 30 ? "MONTHLY" : "CUSTOM");
              const chemTitle = `הוספת ${chemItem.amount} ${chemItem.unit || chemical.unit || "גרם"} ${chemical.name}`;

              const existingTask = await prisma.maintenanceTask.findFirst({
                where: {
                  userId: user.id,
                  OR: [
                    { title: { contains: chemical.name } },
                    { description: { contains: chemical.name } },
                  ],
                },
              });

              if (existingTask) {
                await prisma.maintenanceTask.update({
                  where: { id: existingTask.id },
                  data: {
                    title: chemTitle,
                    description: `שגרת הוספת חומר: ${chemItem.amount} ${chemItem.unit || chemical.unit || "גרם"} ${chemical.name} כל ${repeatDaysNum} ימים.`,
                    frequencyDays: repeatDaysNum,
                    nextDueDate: nextDue,
                    lastDoneDate: actionDateObj,
                    category: taskCategory,
                    isCompleted: false,
                  },
                });
              } else {
                await prisma.maintenanceTask.create({
                  data: {
                    userId: user.id,
                    title: chemTitle,
                    description: `שגרת הוספת חומר: ${chemItem.amount} ${chemItem.unit || chemical.unit || "גרם"} ${chemical.name} כל ${repeatDaysNum} ימים.`,
                    category: taskCategory,
                    frequencyDays: repeatDaysNum,
                    nextDueDate: nextDue,
                    lastDoneDate: actionDateObj,
                    priority: "MEDIUM",
                    isCompleted: false,
                  },
                });
              }
            }
          }
        }
      }
    }

    // 1. Apply Schedule Shifts to existing Maintenance Tasks
    const shiftedTasksSummary = [];
    for (const shift of scheduleShifts) {
      if (shift.taskId && shift.newDueDate) {
        const updated = await prisma.maintenanceTask.updateMany({
          where: { id: shift.taskId, userId: user.id },
          data: {
            nextDueDate: new Date(shift.newDueDate),
            description: shift.reason ? `עודכן בעקבות פעולה יזומה: ${shift.reason}` : undefined,
          },
        });
        if (updated.count > 0) {
          shiftedTasksSummary.push(shift.taskTitle);
        }
      }
    }

    // 2. Create new follow-up tasks
    const createdTasks = [];
    for (const newTask of newTasksToCreate) {
      const task = await prisma.maintenanceTask.create({
        data: {
          userId: user.id,
          title: newTask.title,
          description: newTask.description || "משימת המשך בעקבות פעולת אחזקה יזומה",
          category: "CUSTOM",
          frequencyDays: Math.max(1, Math.round((newTask.hoursAhead || 24) / 24)),
          nextDueDate: new Date(newTask.dueDate || Date.now() + (newTask.hoursAhead || 24) * 3600 * 1000),
          priority: newTask.priority || "HIGH",
          isCompleted: false,
        },
      });
      createdTasks.push(task);
    }

    // 3. Determine Water Change & Create Diary Entry
    const isActualWaterChange = updateJacuzziRefill || textLower.includes("החלפת מים") || textLower.includes("החלפתי מים") || textLower.includes("מים חדשים") || textLower.includes("מילאתי מים") || textLower.includes("מילוי מים") || textLower.includes("ריקון") || textLower.includes("ריענון מים");
    let calculatedRefillPct = (isActualWaterChange && body.refillPercentage !== undefined) ? body.refillPercentage : (updateJacuzziRefill ? 100 : 0);
    if (calculatedRefillPct === 0 && isActualWaterChange) {
      if (textLower.includes("50") || textLower.includes("חצי")) calculatedRefillPct = 50;
      else if (textLower.includes("25") || textLower.includes("רבע")) calculatedRefillPct = 25;
      else if (textLower.includes("30") || textLower.includes("שליש")) calculatedRefillPct = 30;
    }

    let diaryTitle = (suggestedDiaryTitle || freeText || "פעולת אחזקה").trim();
    let diaryContent = (suggestedDiaryContent || freeText || "").trim();
    if (calculatedRefillPct > 0) {
      diaryTitle = `החלפת מים (${calculatedRefillPct}%)`;
      diaryContent = `החלפת ${calculatedRefillPct}% ממי הג'קוזי במים טריים`;
    }

    const diaryEntry = await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        title: diaryTitle,
        content: diaryContent,
        entryDate: actionDateObj,
        waterQualityRating: 5,
        chemicalsAdded: chemicalDeductionsSummary.length > 0 ? chemicalDeductionsSummary.join(", ") : undefined,
      },
    });

    // 4. Update lastDoneDate on executed task categories for accurate future scheduling
    if (textLower.includes("דפנ") || textLower.includes("קו מים") || textLower.includes("דופן")) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, OR: [{ title: { contains: "דפנ" } }, { title: { contains: "קו מים" } }, { title: { contains: "דופן" } }] },
        data: { lastDoneDate: actionDateObj },
      });
    }
    if (textLower.includes("שטיפת פילטר") || textLower.includes("שטפתי פילטר") || textLower.includes("ניקוי פילטר בזרם") || (textLower.includes("פילטר") && textLower.includes("שטיפ"))) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, title: { contains: "פילטר" }, NOT: [{ title: { contains: "חדש" } }, { title: { contains: "החלפ" } }, { title: { contains: "השריה" } }] },
        data: { lastDoneDate: actionDateObj },
      });
    }
    if (textLower.includes("החלפת פילטר") || textLower.includes("פילטר חדש")) {
      await prisma.jacuzzi.update({
        where: { userId: user.id },
        data: { lastFilterReplaceDate: actionDateObj },
      });
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, OR: [{ title: { contains: "החלפת פילטר" } }, { title: { contains: "פילטר חדש" } }, { category: "ANNUAL" }] },
        data: { lastDoneDate: actionDateObj },
      });
    }
    if (textLower.includes("השרי") || textLower.includes("השריה")) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, OR: [{ title: { contains: "השריה" } }, { title: { contains: "עמוק" } }] },
        data: { lastDoneDate: actionDateObj },
      });
    }
    if (textLower.includes("אנזים") || textLower.includes("אנזימים")) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, title: { contains: "אנזים" } },
        data: { lastDoneDate: actionDateObj },
      });
    }
    if (textLower.includes("כיסוי")) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, title: { contains: "כיסוי" } },
        data: { lastDoneDate: actionDateObj },
      });
    }
    if (textLower.includes("צנרת") || textLower.includes("flush") || textLower.includes("ביופילם")) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, OR: [{ title: { contains: "צנרת" } }, { title: { contains: "Flush" } }] },
        data: { lastDoneDate: actionDateObj },
      });
    }

    const refillPct = calculatedRefillPct;

    if (textLower.includes("חלקית") || textLower.includes("ריענון") || (textLower.includes("החלפ") && textLower.includes("מים") && !textLower.includes("מלאה") && !updateJacuzziRefill)) {
      await prisma.maintenanceTask.updateMany({
        where: { userId: user.id, OR: [{ title: { contains: "חלקית" } }, { title: { contains: "ריענון" } }, { title: { contains: "החלפת מים" } }] },
        data: { 
          lastDoneDate: actionDateObj,
          description: refillPct > 0 ? `החלפת ${refillPct}% מים וריענון (כל 30 ימים)` : undefined,
        },
      });
    }
    let updatedWaterAgeMessage = "";

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    if (jacuzzi && refillPct > 0 && isActualWaterChange) {
      if (refillPct >= 95 || updateJacuzziRefill) {
        // 100% Full Refill
        await prisma.jacuzzi.update({
          where: { userId: user.id },
          data: { lastRefillDate: actionDateObj },
        });

        // Remove old one-off custom tasks from old water
        await prisma.maintenanceTask.deleteMany({
          where: {
            userId: user.id,
            category: "CUSTOM",
            isCompleted: false,
          },
        });

        updatedWaterAgeMessage = "גיל המים אופס ל-0 ימים (מילוי מלא) ושובץ מחזור בקרות מים חדש.";
      } else {
        // Partial refill: Calculate effective age
        let currentAgeDays = 0;
        if (body.currentWaterAgeDays !== undefined && body.currentWaterAgeDays > 0) {
          currentAgeDays = body.currentWaterAgeDays;
        } else if (jacuzzi.lastRefillDate) {
          const currentRefillTime = new Date(jacuzzi.lastRefillDate).getTime();
          currentAgeDays = Math.max(0, Math.round((actionDateObj.getTime() - currentRefillTime) / (24 * 3600 * 1000)));
        }

        // If the system had 0 days because it was newly registered today, assume standard 60 days baseline
        if (currentAgeDays <= 0) {
          currentAgeDays = 60;
        }

        const newAgeDays = Math.max(1, Math.round(currentAgeDays * (1 - refillPct / 100)));
        const newEffectiveRefillDate = new Date(actionDateObj.getTime() - newAgeDays * 24 * 3600 * 1000);

        await prisma.jacuzzi.update({
          where: { userId: user.id },
          data: { lastRefillDate: newEffectiveRefillDate },
        });

        updatedWaterAgeMessage = `גיל המים שוקלל מחדש מ-${currentAgeDays} ימים ל-${newAgeDays} ימים (הרווחת עוד ${currentAgeDays - newAgeDays} ימים בעקבות החלפת ${refillPct}% מים!).`;
      }
    }

    return NextResponse.json({
      success: true,
      diaryEntry,
      shiftedTasksCount: shiftedTasksSummary.length,
      createdTasksCount: createdTasks.length,
      message: `פעולת האחזקה היזומה תועדה ביומן בהצלחה! ${updatedWaterAgeMessage} ${shiftedTasksSummary.length > 0 ? `עודכנו ${shiftedTasksSummary.length} זימונים בלוח השנה` : ""} ${createdTasks.length > 0 ? `ונוספו ${createdTasks.length} משימות מעקב חדשות` : ""}.`,
    });
  } catch (error: any) {
    console.error("Apply proactive maintenance error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בהחלת השינויים בלוח השנה" }, { status: 500 });
  }
}
