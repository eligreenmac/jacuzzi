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
      description,
      imageUrl,
    } = body;

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

    // Auto-generate rich AI diagnosis & chemical inventory matching
    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters: jacuzzi?.volumeLiters || 1200,
      sanitizationType: jacuzzi?.sanitizationType || "CHLORINE",
      waterClarity: waterClarity || "CLEAR",
      description,
      ph: parsedPh !== null ? parsedPh : "UNKNOWN",
      freeChlorine: parsedCl !== null ? parsedCl : "UNKNOWN",
      alkalinity: parsedAlk !== null ? parsedAlk : "UNKNOWN",
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });

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
        description: description || null,
        imageUrl: imageUrl || null,
        aiDiagnosis: diagnosis.waterStatusSummary,
        aiRecommendations: JSON.stringify(diagnosis),
      },
    });

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

    // Auto-generate rich AI diagnosis & chemical inventory matching
    const diagnosis = await analyzeWaterWithGemini({
      volumeLiters: jacuzzi?.volumeLiters || 1200,
      sanitizationType: jacuzzi?.sanitizationType || "CHLORINE",
      waterClarity: (waterClarity || existing.waterClarity || "CLEAR") as string,
      description: description !== undefined ? description : existing.description || undefined,
      ph: parsedPh !== null ? parsedPh : "UNKNOWN",
      freeChlorine: parsedCl !== null ? parsedCl : "UNKNOWN",
      alkalinity: parsedAlk !== null ? parsedAlk : "UNKNOWN",
      inventory: inventory.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
      })),
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
