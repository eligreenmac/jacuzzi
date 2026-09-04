import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateFullJacuzziDiagnostic } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    // 1. Fetch Jacuzzi Details
    let jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    if (!jacuzzi) {
      jacuzzi = await prisma.jacuzzi.create({
        data: {
          userId: user.id,
          volumeLiters: 1200,
          sanitizationType: "CHLORINE",
        },
      });
    }

    const now = Date.now();
    let waterAgeDays = 30;
    if (jacuzzi.lastRefillDate) {
      const diffMs = now - new Date(jacuzzi.lastRefillDate).getTime();
      waterAgeDays = Math.max(0, Math.floor(diffMs / (24 * 3600 * 1000)));
    }

    // 2. Fetch Latest Water Test
    const latestWaterLog = await prisma.waterLog.findFirst({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
    });

    let latestWaterTestPayload = null;
    if (latestWaterLog) {
      const testAgeDays = Math.max(
        0,
        Math.floor((now - new Date(latestWaterLog.testedAt).getTime()) / (24 * 3600 * 1000))
      );

      latestWaterTestPayload = {
        testedAt: latestWaterLog.testedAt,
        daysAgo: testAgeDays,
        ph: latestWaterLog.ph,
        phRange: latestWaterLog.phRange,
        freeChlorine: latestWaterLog.freeChlorine,
        chlorineRange: latestWaterLog.chlorineRange,
        alkalinity: latestWaterLog.alkalinity,
        alkalinityRange: latestWaterLog.alkalinityRange,
        calcium: latestWaterLog.calcium,
        calciumRange: latestWaterLog.calciumRange,
        bromine: latestWaterLog.bromine,
        bromineRange: latestWaterLog.bromineRange,
        totalChlorine: latestWaterLog.totalChlorine,
        cya: latestWaterLog.cya,
        salt: latestWaterLog.salt,
        waterTemp: latestWaterLog.waterTemp,
        waterClarity: latestWaterLog.waterClarity,
        waterOdor: (latestWaterLog as any).waterOdor || "FRESH",
        clarityOdorNotes: (latestWaterLog as any).clarityOdorNotes || latestWaterLog.description,
        description: latestWaterLog.description,
      };
    }

    // 3. Fetch Maintenance Tasks & Routines
    const tasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { nextDueDate: "asc" },
    });

    const tasksPayload = tasks.map((t) => {
      let diffDays = 0;
      let isOverdue = false;
      if (t.nextDueDate) {
        const dueTime = new Date(t.nextDueDate).getTime();
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        diffDays = Math.round((dueTime - startOfToday) / (24 * 3600 * 1000));
        isOverdue = diffDays < 0;
      }
      return {
        id: t.id,
        title: t.title,
        category: t.category,
        frequencyDays: t.frequencyDays || 7,
        lastDoneDate: t.lastDoneDate,
        nextDueDate: t.nextDueDate,
        isOverdue,
        daysOverdueOrDue: Math.abs(diffDays),
      };
    });

    // 4. Fetch Chemical Inventory
    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });

    const inventoryPayload = inventory.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      minThreshold: i.minThreshold,
      isLowStock: i.quantity <= i.minThreshold,
    }));

    // 5. Fetch Recent Diary Logs
    const recentLogs = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { entryDate: "desc" },
      take: 10,
    });

    const recentLogsPayload = recentLogs.map((l) => ({
      date: l.entryDate,
      title: l.title,
      content: l.content,
    }));

    // 6. Generate Full Diagnostic with Gemini AI / Fallback Engine
    const diagnostic = await generateFullJacuzziDiagnostic({
      jacuzzi: {
        volumeLiters: jacuzzi.volumeLiters,
        sanitizationType: jacuzzi.sanitizationType,
        brand: jacuzzi.brand,
        model: jacuzzi.model,
        lastRefillDate: jacuzzi.lastRefillDate,
        waterAgeDays,
        lastDeepCleanDate: jacuzzi.lastDeepCleanDate,
        lastFilterReplaceDate: jacuzzi.lastFilterReplaceDate,
      },
      latestWaterTest: latestWaterTestPayload,
      tasks: tasksPayload,
      inventory: inventoryPayload,
      recentLogs: recentLogsPayload,
    });

    return NextResponse.json({
      success: true,
      diagnostic,
      rawSummary: {
        waterAgeDays,
        volumeLiters: jacuzzi.volumeLiters,
        sanitizationType: jacuzzi.sanitizationType,
        hasWaterTest: !!latestWaterLog,
        totalTasks: tasks.length,
        overdueTasksCount: tasksPayload.filter((t) => t.isOverdue).length,
        lowStockItemsCount: inventoryPayload.filter((i) => i.isLowStock).length,
      },
    });
  } catch (error: any) {
    console.error("Full Jacuzzi diagnostic error:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה ביצירת אבחון כולל לג'קוזי" },
      { status: 500 }
    );
  }
}
