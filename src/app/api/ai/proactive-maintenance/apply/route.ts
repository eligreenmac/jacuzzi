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

    // 3. Create Diary Entry
    const diaryTitle = suggestedDiaryTitle || `פעולת אחזקה יזומה: ${freeText.substring(0, 40)}...`;
    const diaryContent = suggestedDiaryContent || freeText;
    const diaryEntry = await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        title: diaryTitle,
        content: diaryContent,
        entryDate: actionDateObj,
        waterQualityRating: 5,
      },
    });

    // 4. Update Jacuzzi water age (Weighted for partial refills or reset for 100% full refills)
    const refillPct = body.refillPercentage || (updateJacuzziRefill ? 100 : 0);
    let updatedWaterAgeMessage = "";

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    if (jacuzzi && refillPct > 0) {
      const currentRefillTime = new Date(jacuzzi.lastRefillDate || jacuzzi.createdAt).getTime();
      const currentAgeMs = Math.max(0, actionDateObj.getTime() - currentRefillTime);

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
        // Partial refill: New effective age = currentAge * (1 - refillPercentage/100)
        const factor = Math.max(0, 1 - refillPct / 100);
        const newAgeMs = currentAgeMs * factor;
        const newEffectiveRefillDate = new Date(actionDateObj.getTime() - newAgeMs);

        await prisma.jacuzzi.update({
          where: { userId: user.id },
          data: { lastRefillDate: newEffectiveRefillDate },
        });

        const newAgeDays = Math.round(newAgeMs / (24 * 3600 * 1000));
        updatedWaterAgeMessage = `גיל המים שוקלל מחדש ל-${newAgeDays} ימים (בעקבות החלפת ${refillPct}% מים).`;
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
