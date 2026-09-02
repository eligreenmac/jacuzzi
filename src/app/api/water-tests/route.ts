import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeWaterWithGemini } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const tests = await prisma.waterLog.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
    });

    return NextResponse.json({ tests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function resolveNumericValue(
  val: number | null,
  rangeStr?: string | null,
  type: "PH" | "CL" | "ALK" = "PH"
): number | "UNKNOWN" {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (!rangeStr) return "UNKNOWN";
  const s = rangeStr.toUpperCase();
  if (type === "PH") {
    if (s.includes("VERY_LOW") || s.includes("חומצי מאוד")) return 6.5;
    if (s.includes("LOW") || s.includes("נמוך")) return 7.0;
    if (s.includes("OK") || s.includes("תקין")) return 7.4;
    if (s.includes("VERY_HIGH") || s.includes("בסיסי מאוד")) return 8.3;
    if (s.includes("HIGH") || s.includes("גבוה")) return 7.8;
  }
  if (type === "CL") {
    if (s.includes("VERY_LOW") || s.includes("ללא חיטוי")) return 0.0;
    if (s.includes("LOW") || s.includes("נמוך")) return 1.0;
    if (s.includes("OK") || s.includes("תקין")) return 3.0;
    if (s.includes("VERY_HIGH") || s.includes("שוק") || s.includes("עודף")) return 10.0;
    if (s.includes("HIGH") || s.includes("גבוה")) return 6.0;
  }
  if (type === "ALK") {
    if (s.includes("VERY_LOW") || s.includes("נמוכה מאוד")) return 30;
    if (s.includes("LOW") || s.includes("נמוכה")) return 60;
    if (s.includes("OK") || s.includes("תקינה")) return 100;
    if (s.includes("VERY_HIGH") || s.includes("גבוהה מאוד")) return 200;
    if (s.includes("HIGH") || s.includes("גבוהה")) return 150;
  }
  return "UNKNOWN";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const {
      testedAt,
      ph,
      phRange,
      freeChlorine,
      chlorineRange,
      alkalinity,
      alkalinityRange,
      waterClarity,
      calcium,
      calciumRange,
      totalChlorine,
      totalChlorineRange,
      cya,
      cyaRange,
      salt,
      saltRange,
      waterTemp,
      waterTempRange,
      carbonate,
      carbonateRange,
      bromine,
      bromineRange,
      nitrate,
      nitrateRange,
      nitrite,
      nitriteRange,
      iron,
      ironRange,
      copper,
      copperRange,
      chromium,
      chromiumRange,
      lead,
      leadRange,
      mercury,
      mercuryRange,
      fluoride,
      fluorideRange,
      extendedMetrics,
      testedParams,
      description,
      imageUrl,
    } = body;

    const parseNum = (val: any) => (val === "UNKNOWN" || val === "" || val === undefined || val === null ? null : parseFloat(val));

    const parsedPh = parseNum(ph);
    const parsedCl = parseNum(freeChlorine);
    const parsedAlk = parseNum(alkalinity);
    const parsedCalcium = parseNum(calcium);
    const parsedTotalCl = parseNum(totalChlorine);
    const parsedCya = parseNum(cya);
    const parsedSalt = parseNum(salt);
    const parsedWaterTemp = parseNum(waterTemp);
    const parsedCarbonate = parseNum(carbonate);
    const parsedBromine = parseNum(bromine);
    const parsedNitrate = parseNum(nitrate);
    const parsedNitrite = parseNum(nitrite);
    const parsedIron = parseNum(iron);
    const parsedCopper = parseNum(copper);
    const parsedChromium = parseNum(chromium);
    const parsedLead = parseNum(lead);
    const parsedMercury = parseNum(mercury);
    const parsedFluoride = parseNum(fluoride);

    const effectivePh = resolveNumericValue(parsedPh, phRange, "PH");
    const effectiveCl = resolveNumericValue(parsedCl, chlorineRange, "CL");
    const effectiveAlk = resolveNumericValue(parsedAlk, alkalinityRange, "ALK");

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    const recentLogs = await prisma.waterLog.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
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

    // Extract unexecuted recommendations from previous logs
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

    // Auto-generate rich AI diagnosis factoring in unexecuted treatments
    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters: jacuzzi?.volumeLiters || 1200,
      sanitizationType: jacuzzi?.sanitizationType || "CHLORINE",
      waterClarity: waterClarity || "CLEAR",
      description,
      ph: effectivePh,
      freeChlorine: effectiveCl,
      alkalinity: effectiveAlk,
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
      addedChemicalsLedger,
      pendingUnexecutedRecommendations: pendingUnexecutedRecommendations.slice(0, 5),
    });

    const activeTestedParamsStr = testedParams
      ? (typeof testedParams === "string" ? testedParams : JSON.stringify(testedParams))
      : (jacuzzi?.testStripParams || '["ph","chlorine","alkalinity","clarity"]');

    const newTest = await prisma.waterLog.create({
      data: {
        userId: user.id,
        testedAt: testedAt ? new Date(testedAt) : new Date(),
        ph: parsedPh,
        phRange: phRange || null,
        freeChlorine: parsedCl,
        chlorineRange: chlorineRange || null,
        alkalinity: parsedAlk,
        alkalinityRange: alkalinityRange || null,
        waterClarity: waterClarity || "CLEAR",
        calcium: parsedCalcium,
        calciumRange: calciumRange || null,
        totalChlorine: parsedTotalCl,
        totalChlorineRange: totalChlorineRange || null,
        cya: parsedCya,
        cyaRange: cyaRange || null,
        salt: parsedSalt,
        saltRange: saltRange || null,
        waterTemp: parsedWaterTemp,
        waterTempRange: waterTempRange || null,
        carbonate: parsedCarbonate,
        carbonateRange: carbonateRange || null,
        bromine: parsedBromine,
        bromineRange: bromineRange || null,
        nitrate: parsedNitrate,
        nitrateRange: nitrateRange || null,
        nitrite: parsedNitrite,
        nitriteRange: nitriteRange || null,
        iron: parsedIron,
        ironRange: ironRange || null,
        copper: parsedCopper,
        copperRange: copperRange || null,
        chromium: parsedChromium,
        chromiumRange: chromiumRange || null,
        lead: parsedLead,
        leadRange: leadRange || null,
        mercury: parsedMercury,
        mercuryRange: mercuryRange || null,
        fluoride: parsedFluoride,
        fluorideRange: fluorideRange || null,
        extendedMetrics: extendedMetrics ? (typeof extendedMetrics === "string" ? extendedMetrics : JSON.stringify(extendedMetrics)) : null,
        testedParams: activeTestedParamsStr,
        description: description || null,
        imageUrl: imageUrl || null,
        aiDiagnosis: diagnosis.waterStatusSummary,
        aiRecommendations: JSON.stringify(diagnosis),
      },
    });

    // 🌟 Auto-sync with open water test routine tasks in calendar
    try {
      const now = new Date();
      const openWaterTasks = await prisma.maintenanceTask.findMany({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: "בדיקת מים" } },
            { title: { contains: "מקלון" } },
            { title: { contains: "בדיקה שבועית" } },
            { category: "WATER_TEST" },
          ],
        },
      });

      for (const task of openWaterTasks) {
        const valAfter = `pH: ${phRange || (parsedPh ? `pH ${parsedPh}` : "נבדק")}, חיטוי: ${chlorineRange || (parsedCl ? `${parsedCl} ppm` : "נבדק")}, TA: ${alkalinityRange || (parsedAlk ? `${parsedAlk} ppm` : "נבדק")}`;
        const isOneTime = task.category === "CUSTOM" || task.title.includes("חוזרת") || task.title.includes("מעקב") || (task.frequencyDays && task.frequencyDays <= 1);

        if (isOneTime) {
          await prisma.maintenanceTask.update({
            where: { id: task.id },
            data: {
              lastDoneDate: now,
              isCompleted: true,
              lastValueAfter: valAfter,
            },
          });
        } else {
          // Regular weekly water test routine: schedule 7 days ahead (weekly cycle)
          const freq = Math.max(7, task.frequencyDays || 7);
          const nextDate = new Date(now.getTime() + freq * 24 * 60 * 60 * 1000);

          await prisma.maintenanceTask.update({
            where: { id: task.id },
            data: {
              lastDoneDate: now,
              nextDueDate: nextDate,
              frequencyDays: freq,
              isCompleted: false,
              lastValueAfter: valAfter,
            },
          });
        }
      }

      // 🌟 Close all previous open treatment/follow-up tasks from older tests
      const oldTreatmentTasks = await prisma.maintenanceTask.findMany({
        where: {
          userId: user.id,
          isCompleted: false,
          OR: [
            { title: { contains: "מעקב" } },
            { title: { contains: "בדיקה חוזרת" } },
            { title: { contains: "הוספת מעלה" } },
            { title: { contains: "הוספת מוריד" } },
            { title: { contains: "איזון" } },
            { category: "CUSTOM" },
          ],
        },
      });

      for (const oldTask of oldTreatmentTasks) {
        await prisma.maintenanceTask.update({
          where: { id: oldTask.id },
          data: {
            isCompleted: true,
            lastDoneDate: now,
            lastValueAfter: "נסגר אוטומטית - הוחלף בתוצאות בדיקת מים עדכנית",
          },
        });
      }

      // 🌟 Mark all previous water logs' treatment plans as superseded
      const previousLogs = await prisma.waterLog.findMany({
        where: {
          userId: user.id,
          id: { not: newTest.id },
        },
      });

      for (const prevLog of previousLogs) {
        if (prevLog.aiRecommendations) {
          try {
            const recObj = JSON.parse(prevLog.aiRecommendations);
            if (recObj.stepByStepPlan && Array.isArray(recObj.stepByStepPlan)) {
              let modified = false;
              recObj.stepByStepPlan = recObj.stepByStepPlan.map((step: any) => {
                if (!step.isExecuted) {
                  modified = true;
                  return { ...step, isExecuted: true, isSuperseded: true, supersededBy: newTest.id };
                }
                return step;
              });
              if (modified) {
                await prisma.waterLog.update({
                  where: { id: prevLog.id },
                  data: { aiRecommendations: JSON.stringify(recObj) },
                });
              }
            }
          } catch (err) {}
        }
      }
    } catch (syncErr) {
      console.error("Failed to auto-sync water test with tasks:", syncErr);
    }

    return NextResponse.json({ success: true, test: newTest, diagnosis });
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
      testedAt,
      ph,
      phRange,
      freeChlorine,
      chlorineRange,
      alkalinity,
      alkalinityRange,
      waterClarity,
      description,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "מזהה בדיקה חסר" }, { status: 400 });
    }

    const existing = await prisma.waterLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "רשומת בדיקה לא נמצאה" }, { status: 404 });
    }

    const parsedPh = ph === "UNKNOWN" || ph === "" || ph === undefined || ph === null ? null : parseFloat(ph);
    const parsedCl =
      freeChlorine === "UNKNOWN" || freeChlorine === "" || freeChlorine === undefined || freeChlorine === null
        ? null
        : parseFloat(freeChlorine);
    const parsedAlk =
      alkalinity === "UNKNOWN" || alkalinity === "" || alkalinity === undefined || alkalinity === null
        ? null
        : parseFloat(alkalinity);

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    const recentLogs = await prisma.waterLog.findMany({
      where: { userId: user.id, id: { not: id } },
      orderBy: { testedAt: "desc" },
      take: 10,
    });

    const recentDiary = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { entryDate: "desc" },
      take: 15,
    });

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

    const effectivePh = resolveNumericValue(parsedPh, phRange !== undefined ? phRange : existing.phRange, "PH");
    const effectiveCl = resolveNumericValue(parsedCl, chlorineRange !== undefined ? chlorineRange : existing.chlorineRange, "CL");
    const effectiveAlk = resolveNumericValue(parsedAlk, alkalinityRange !== undefined ? alkalinityRange : existing.alkalinityRange, "ALK");

    // Auto-generate rich AI diagnosis & chemical inventory matching
    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters: jacuzzi?.volumeLiters || 1200,
      sanitizationType: jacuzzi?.sanitizationType || "CHLORINE",
      waterClarity: (waterClarity || existing.waterClarity || "CLEAR") as string,
      description: description !== undefined ? description : existing.description || undefined,
      ph: effectivePh,
      freeChlorine: effectiveCl,
      alkalinity: effectiveAlk,
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
      addedChemicalsLedger,
      pendingUnexecutedRecommendations: pendingUnexecutedRecommendations.slice(0, 5),
    });

    const updated = await prisma.waterLog.update({
      where: { id },
      data: {
        testedAt: testedAt ? new Date(testedAt) : undefined,
        ph: parsedPh,
        phRange: phRange !== undefined ? phRange : undefined,
        freeChlorine: parsedCl,
        chlorineRange: chlorineRange !== undefined ? chlorineRange : undefined,
        alkalinity: parsedAlk,
        alkalinityRange: alkalinityRange !== undefined ? alkalinityRange : undefined,
        waterClarity: waterClarity !== undefined ? waterClarity : undefined,
        description: description !== undefined ? description : undefined,
        aiDiagnosis: diagnosis.waterStatusSummary,
        aiRecommendations: JSON.stringify(diagnosis),
      },
    });

    return NextResponse.json({ success: true, test: updated, diagnosis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה בדיקה חסר" }, { status: 400 });
    }

    await prisma.waterLog.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
