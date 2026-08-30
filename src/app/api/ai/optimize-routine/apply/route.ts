import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const {
      tasksToDelete = [], // Array of taskIds or { taskId: string }
      tasksToUpdate = [], // Array of { taskId: string, newDueDate: string, newFrequencyDays?: number }
      tasksToCreate = [], // Array of { title: string, description?: string, category?: string, frequencyDays?: number, nextDueDate: string, priority?: string }
      summary,
    } = body;

    let deletedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;

    // 1. Delete selected unneeded tasks
    for (const item of tasksToDelete) {
      const taskId = typeof item === "string" ? item : item.taskId;
      if (taskId) {
        const del = await prisma.maintenanceTask.deleteMany({
          where: { id: taskId, userId: user.id },
        });
        deletedCount += del.count;
      }
    }

    // 2. Update tasks
    for (const item of tasksToUpdate) {
      if (item.taskId) {
        const upd = await prisma.maintenanceTask.updateMany({
          where: { id: item.taskId, userId: user.id },
          data: {
            nextDueDate: item.newDueDate ? new Date(item.newDueDate) : undefined,
            frequencyDays: item.newFrequencyDays !== undefined ? item.newFrequencyDays : undefined,
            description: item.reason ? `עודכן באופטימיזציית AI: ${item.reason}` : undefined,
          },
        });
        updatedCount += upd.count;
      }
    }

    // 3. Create new tasks
    for (const item of tasksToCreate) {
      if (item.title) {
        await prisma.maintenanceTask.create({
          data: {
            userId: user.id,
            title: item.title,
            description: item.description || "נוצר אוטומטית באופטימיזציית שגרת טיפולים של ה-AI",
            category: item.category || "WEEKLY",
            frequencyDays: item.frequencyDays || 7,
            nextDueDate: new Date(item.nextDueDate || Date.now() + 7 * 24 * 3600 * 1000),
            priority: item.priority || "MEDIUM",
            isCompleted: false,
          },
        });
        createdCount++;
      }
    }

    // 4. Record Diary Entry
    const diaryContent = `בוצעה אופטימיזציית שגרת טיפולים על ידי ה-AI: נמחקו ${deletedCount} משימות לא רלוונטיות, עודכנו ${updatedCount} זימונים, ונוספו ${createdCount} משימות יסוד חדשות. ${summary ? `סיכום: ${summary}` : ""}`;
    await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        title: "אופטימיזציית שגרת טיפולים וסנכרון לוח שנה (AI)",
        content: diaryContent,
        entryDate: new Date(),
        waterQualityRating: 5,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      updatedCount,
      createdCount,
      message: `שגרת הטיפולים עודכנה בהצלחה! נמחקו ${deletedCount} משימות מיותרות, עודכנו ${updatedCount} משימות, ונוספו ${createdCount} משימות חדשות ללוח השנה.`,
    });
  } catch (error: any) {
    console.error("Apply routine optimization error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בהחלת אופטימיזציית השגרה" }, { status: 500 });
  }
}
