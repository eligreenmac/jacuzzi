import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optimizeRoutineWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const currentTasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { nextDueDate: "asc" },
    });

    const recentWaterLogs = await prisma.waterLog.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
      take: 10,
    });

    const recentDiary = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { entryDate: "desc" },
      take: 15,
    });

    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    const refillDate = jacuzzi?.lastRefillDate || jacuzzi?.createdAt || new Date();
    const waterAgeDays = Math.max(0, Math.floor((Date.now() - new Date(refillDate).getTime()) / (1000 * 60 * 60 * 24)));

    const optimization = await optimizeRoutineWithGemini({
      volumeLiters: jacuzzi?.volumeLiters || 1200,
      sanitizationType: jacuzzi?.sanitizationType || "CHLORINE",
      location: jacuzzi?.location || "OUTDOOR",
      usageFrequency: jacuzzi?.usageFrequency || "MEDIUM",
      lastRefillDate: refillDate,
      waterAgeDays,
      currentTasks: currentTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        frequencyDays: t.frequencyDays,
        nextDueDate: t.nextDueDate,
        isCompleted: t.isCompleted,
        lastDoneDate: t.lastDoneDate,
      })),
      recentWaterLogs: recentWaterLogs.map((l) => ({
        testedAt: l.testedAt,
        ph: l.ph,
        freeChlorine: l.freeChlorine,
        alkalinity: l.alkalinity,
        waterClarity: l.waterClarity,
        aiDiagnosis: l.aiDiagnosis,
      })),
      recentDiary: recentDiary.map((d) => ({
        entryDate: d.entryDate,
        title: d.title,
        chemicalsAdded: d.chemicalsAdded,
        content: d.content,
      })),
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });

    return NextResponse.json({
      success: true,
      optimization,
      waterAgeDays,
      currentTasksCount: currentTasks.length,
    });
  } catch (error: any) {
    console.error("Routine optimization scan error:", error);
    return NextResponse.json({ error: error.message || "שגיאה באופטימיזציית שגרת הטיפולים" }, { status: 500 });
  }
}
