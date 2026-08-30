import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeProactiveMaintenance } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const { freeText, actionDate, currentWaterAgeDays } = body;

    if (!freeText || !freeText.trim()) {
      return NextResponse.json({ error: "נא לתאר את פעולת התחזוקה שביצעת במלל חופשי" }, { status: 400 });
    }

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const currentTasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id, isCompleted: false },
      orderBy: { nextDueDate: "asc" },
    });

    // Calculate effective lastRefillDate
    let calculatedRefillDate: Date;
    if (currentWaterAgeDays !== undefined && currentWaterAgeDays > 0) {
      calculatedRefillDate = new Date(Date.now() - currentWaterAgeDays * 24 * 3600 * 1000);
    } else if (jacuzzi?.lastRefillDate) {
      calculatedRefillDate = new Date(jacuzzi.lastRefillDate);
    } else {
      calculatedRefillDate = new Date(Date.now() - 60 * 24 * 3600 * 1000); // 60 days standard baseline
    }

    const analysis = await analyzeProactiveMaintenance({
      freeText,
      actionDate: actionDate ? new Date(actionDate) : new Date(),
      volumeLiters: jacuzzi?.volumeLiters || 1200,
      sanitizationType: jacuzzi?.sanitizationType || "CHLORINE",
      lastRefillDate: calculatedRefillDate,
      currentTasks: currentTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        frequencyDays: t.frequencyDays,
        nextDueDate: t.nextDueDate,
      })),
    });

    return NextResponse.json({
      success: true,
      analysis,
      currentTasksCount: currentTasks.length,
    });
  } catch (error: any) {
    console.error("Proactive maintenance analysis error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בניתוח פעולת התחזוקה" }, { status: 500 });
  }
}
