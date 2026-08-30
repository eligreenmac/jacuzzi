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
      calcium,
      cya,
      tds,
      phosphates,
      waterTemp,
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

    const recentDiary = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { entryDate: "desc" },
      take: 15,
    });

    // Build chronological chemical addition ledger
    const addedChemicalsLedger: Array<{
      date: Date | string;
      chemical: string;
      amount?: string | null;
      valueBefore?: string | null;
      valueAfter?: string | null;
      notes?: string | null;
    }> = [];

    for (const d of recentDiary) {
      if (d.chemicalsAdded) {
        addedChemicalsLedger.push({
          date: d.entryDate,
          chemical: d.chemicalsAdded,
          amount: d.chemicalsAdded,
          valueBefore: d.valueBefore,
          valueAfter: d.valueAfter,
          notes: d.title + ": " + d.content,
        });
      }
    }

    for (const t of recentTasks) {
      if (t.lastChemicalUsed && t.lastDoneDate) {
        addedChemicalsLedger.push({
          date: t.lastDoneDate,
          chemical: t.lastChemicalUsed,
          amount: t.lastAmountAdded,
          valueBefore: t.lastValueBefore,
          valueAfter: t.lastValueAfter,
          notes: t.title,
        });
      }
    }

    // Sort ledger newest first
    addedChemicalsLedger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Extract unexecuted recommendations from previous logs (to inform future AI)
    const pendingUnexecutedRecommendations: Array<{
      testDate: Date | string;
      stepNumber: number;
      title: string;
      chemical: string;
      amount: string;
      instructions: string;
      reasonUnexecuted: string;
    }> = [];

    for (const log of recentLogs) {
      if (log.aiRecommendations) {
        try {
          const rec = JSON.parse(log.aiRecommendations);
          if (rec.stepByStepPlan && Array.isArray(rec.stepByStepPlan)) {
            for (const s of rec.stepByStepPlan) {
              if (!s.isExecuted && s.chemical && s.chemical !== "ללא חומר" && s.chemical !== "תחזוקה רגילה") {
                const hasInInventory = inventory.some((inv) =>
                  inv.name.toLowerCase().includes(s.chemical.toLowerCase()) ||
                  s.chemical.toLowerCase().includes(inv.name.toLowerCase()) ||
                  (s.chemical.includes("בסיסיות") && inv.category === "PH_PLUS") ||
                  (s.chemical.includes("קצף") && inv.category === "ANTI_FOAM") ||
                  (s.chemical.includes("שוק") && inv.category === "SHOCK")
                );

                pendingUnexecutedRecommendations.push({
                  testDate: log.testedAt,
                  stepNumber: s.stepNumber || 1,
                  title: s.title,
                  chemical: s.chemical,
                  amount: s.amount || "",
                  instructions: s.instructions || "",
                  reasonUnexecuted: !hasInInventory
                    ? "חומר חסר בארון החומרים"
                    : "טרם סומן כבוצע",
                });
              }
            }
          }
        } catch (e) {}
      }
    }

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
    const parsedCalcium =
      calcium === "UNKNOWN" || calcium === "" || calcium === undefined || calcium === null
        ? "UNKNOWN"
        : parseFloat(calcium);
    const parsedCya =
      cya === "UNKNOWN" || cya === "" || cya === undefined || cya === null
        ? "UNKNOWN"
        : parseFloat(cya);
    const parsedTds =
      tds === "UNKNOWN" || tds === "" || tds === undefined || tds === null
        ? "UNKNOWN"
        : parseFloat(tds);
    const parsedPhosphates =
      phosphates === "UNKNOWN" || phosphates === "" || phosphates === undefined || phosphates === null
        ? "UNKNOWN"
        : parseFloat(phosphates);
    const parsedTemp = waterTemp ? parseFloat(waterTemp) : undefined;

    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters,
      sanitizationType,
      waterClarity: waterClarity || "CLEAR",
      description,
      ph: parsedPh,
      freeChlorine: parsedCl,
      alkalinity: parsedAlk,
      calcium: parsedCalcium,
      cya: parsedCya,
      tds: parsedTds,
      phosphates: parsedPhosphates,
      waterTemp: parsedTemp,
      lastRefillDate,
      imageBase64,
      imageMimeType,
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
      addedChemicalsLedger,
      pendingUnexecutedRecommendations: pendingUnexecutedRecommendations.slice(0, 5),
      daysSinceLastPhTest,
      daysSinceLastFilterWash,
      daysSinceLastShock,
    });

    // Note: Water Doctor is a theoretical sandbox and does NOT write to WaterLog history.
    if (saveToLog === true) {
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
      addedChemicalsLedger: addedChemicalsLedger.slice(0, 5),
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
