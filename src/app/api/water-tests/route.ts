import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      freeChlorine,
      alkalinity,
      waterClarity,
      description,
      imageUrl,
      aiDiagnosis,
      aiRecommendations,
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

    const newTest = await prisma.waterLog.create({
      data: {
        userId: user.id,
        testedAt: testedAt ? new Date(testedAt) : new Date(),
        ph: parsedPh,
        freeChlorine: parsedCl,
        alkalinity: parsedAlk,
        waterClarity: waterClarity || "CLEAR",
        description: description || null,
        imageUrl: imageUrl || null,
        aiDiagnosis: aiDiagnosis || null,
        aiRecommendations: typeof aiRecommendations === "object" ? JSON.stringify(aiRecommendations) : aiRecommendations || null,
      },
    });

    return NextResponse.json({ success: true, test: newTest });
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
      freeChlorine,
      alkalinity,
      waterClarity,
      description,
      aiDiagnosis,
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

    const updated = await prisma.waterLog.update({
      where: { id },
      data: {
        testedAt: testedAt ? new Date(testedAt) : undefined,
        ph: parsedPh,
        freeChlorine: parsedCl,
        alkalinity: parsedAlk,
        waterClarity: waterClarity !== undefined ? waterClarity : undefined,
        description: description !== undefined ? description : undefined,
        aiDiagnosis: aiDiagnosis !== undefined ? aiDiagnosis : undefined,
      },
    });

    return NextResponse.json({ success: true, test: updated });
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
