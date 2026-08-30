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

    // 4. Update Jacuzzi refill date if full/major refill
    if (updateJacuzziRefill) {
      await prisma.jacuzzi.updateMany({
        where: { userId: user.id },
        data: { lastRefillDate: actionDateObj },
      });
    }

    return NextResponse.json({
      success: true,
      diaryEntry,
      shiftedTasksCount: shiftedTasksSummary.length,
      createdTasksCount: createdTasks.length,
      message: `פעולת האחזקה היזומה תועדה ביומן בהצלחה! ${shiftedTasksSummary.length > 0 ? `עודכנו ${shiftedTasksSummary.length} זימונים בלוח השנה` : ""} ${createdTasks.length > 0 ? `ונוספו ${createdTasks.length} משימות מעקב חדשות` : ""}.`,
    });
  } catch (error: any) {
    console.error("Apply proactive maintenance error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בהחלת השינויים בלוח השנה" }, { status: 500 });
  }
}
