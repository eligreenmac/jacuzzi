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
      saveToLog = true,
    } = body;

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    const volumeLiters = jacuzzi?.volumeLiters || 1200;
    const sanitizationType = jacuzzi?.sanitizationType || "CHLORINE";
    const lastRefillDate = jacuzzi?.lastRefillDate || new Date();

    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters,
      sanitizationType,
      waterClarity: waterClarity || "CLEAR",
      description,
      ph: ph !== undefined && ph !== "" ? parseFloat(ph) : undefined,
      freeChlorine: freeChlorine !== undefined && freeChlorine !== "" ? parseFloat(freeChlorine) : undefined,
      alkalinity: alkalinity !== undefined && alkalinity !== "" ? parseFloat(alkalinity) : undefined,
      lastRefillDate,
      imageBase64,
      imageMimeType,
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });

    // Save to WaterLog if requested
    if (saveToLog) {
      await prisma.waterLog.create({
        data: {
          userId: user.id,
          ph: ph !== undefined && ph !== "" ? parseFloat(ph) : null,
          freeChlorine: freeChlorine !== undefined && freeChlorine !== "" ? parseFloat(freeChlorine) : null,
          alkalinity: alkalinity !== undefined && alkalinity !== "" ? parseFloat(alkalinity) : null,
          waterClarity: waterClarity || "CLEAR",
          description: description || null,
          imageUrl: imageBase64 ? imageBase64.substring(0, 200) + "...[truncated]" : null,
          aiDiagnosis: diagnosis.waterStatusSummary,
          aiRecommendations: JSON.stringify(diagnosis),
        },
      });
    }

    return NextResponse.json({
      success: true,
      diagnosis,
      jacuzzi,
    });
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    return NextResponse.json({ error: error.message || "שגיאה באבחון המים" }, { status: 500 });
  }
}
