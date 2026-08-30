import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeWaterWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const {
      waterClarity,
      description,
      ph,
      freeChlorine,
      alkalinity,
      imageBase64,
      imageMimeType,
      valueBefore,
      valueAfter,
      amountAdded,
      saveToLog = true,
    } = body;

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    // Query recent history for time-series context
    const recentLogs = await prisma.waterLog.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
      take: 10,
    });

    const recentTasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { lastDoneDate: "desc" },
      take: 10,
    });

    // Calculate time elapsed
    const now = Date.now();
    const lastPhLog = recentLogs.find((l) => l.ph !== null && l.ph !== undefined);
    const lastFilterTask = recentTasks.find((t) => t.title.includes("פילטר") && t.lastDoneDate);
    const lastShockTask = recentTasks.find((t) => (t.title.includes("שוק") || t.title.includes("חיטוי")) && t.lastDoneDate);

    const daysSinceLastPhTest = lastPhLog
      ? Math.floor((now - new Date(lastPhLog.testedAt).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const daysSinceLastFilterWash = lastFilterTask?.lastDoneDate
      ? Math.floor((now - new Date(lastFilterTask.lastDoneDate).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const daysSinceLastShock = lastShockTask?.lastDoneDate
      ? Math.floor((now - new Date(lastShockTask.lastDoneDate).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const historySummary = recentLogs.map((l) => ({
      date: l.testedAt,
      type: "WATER_TEST",
      ph: l.ph,
      freeChlorine: l.freeChlorine,
      valueBefore: l.valueBefore,
      valueAfter: l.valueAfter,
      actionTaken: l.actionsTaken,
    }));

    const volumeLiters = jacuzzi?.volumeLiters || 1200;
    const sanitizationType = jacuzzi?.sanitizationType || "CHLORINE";
    const lastRefillDate = jacuzzi?.lastRefillDate || new Date();

    const parsedPh = ph === "UNKNOWN" || ph === "" || ph === undefined || ph === null ? "UNKNOWN" : parseFloat(ph);
    const parsedCl =
      freeChlorine === "UNKNOWN" || freeChlorine === "" || freeChlorine === undefined || freeChlorine === null
        ? "UNKNOWN"
        : parseFloat(freeChlorine);
    const parsedAlk =
      alkalinity === "UNKNOWN" || alkalinity === "" || alkalinity === undefined || alkalinity === null
        ? "UNKNOWN"
        : parseFloat(alkalinity);

    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters,
      sanitizationType,
      waterClarity: waterClarity || "CLEAR",
      description,
      ph: parsedPh,
      freeChlorine: parsedCl,
      alkalinity: parsedAlk,
      lastRefillDate,
      imageBase64,
      imageMimeType,
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
      history: historySummary,
      daysSinceLastPhTest,
      daysSinceLastFilterWash,
      daysSinceLastShock,
    });

    // Save to WaterLog if requested
    if (saveToLog) {
      await prisma.waterLog.create({
        data: {
          userId: user.id,
          ph: typeof parsedPh === "number" ? parsedPh : null,
          freeChlorine: typeof parsedCl === "number" ? parsedCl : null,
          alkalinity: typeof parsedAlk === "number" ? parsedAlk : null,
          waterClarity: waterClarity || "CLEAR",
          description: description || null,
          imageUrl: imageBase64 ? imageBase64.substring(0, 200) + "...[truncated]" : null,
          aiDiagnosis: diagnosis.waterStatusSummary,
          aiRecommendations: JSON.stringify(diagnosis),
          valueBefore: valueBefore || null,
          valueAfter: valueAfter || null,
          amountAdded: amountAdded || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      diagnosis,
      jacuzzi,
      metrics: {
        daysSinceLastPhTest,
        daysSinceLastFilterWash,
        daysSinceLastShock,
      },
    });
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    return NextResponse.json({ error: error.message || "שגיאה באבחון המים" }, { status: 500 });
  }
}
