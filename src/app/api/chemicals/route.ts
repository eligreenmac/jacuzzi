import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const chemicals = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
      orderBy: { addedDate: "desc" },
    });

    return NextResponse.json({ chemicals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const { name, category, quantity, unit, minThreshold, imageUrl, notes, addedDate } = body;

    if (!name) {
      return NextResponse.json({ error: "שם החומר הוא שדה חובה" }, { status: 400 });
    }

    const chemical = await prisma.chemicalInventory.create({
      data: {
        userId: user.id,
        name,
        category: category || "OTHER",
        quantity: parseFloat(quantity) || 0,
        unit: unit || "GRAMS",
        minThreshold: minThreshold ? parseFloat(minThreshold) : 100,
        imageUrl: imageUrl || null,
        notes: notes || null,
        addedDate: addedDate ? new Date(addedDate) : new Date(),
      },
    });

    return NextResponse.json({ success: true, chemical });
  } catch (error: any) {
    console.error("Add chemical error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const { id, name, category, quantity, unit, minThreshold, imageUrl, notes, addedDate } = body;

    if (!id) {
      return NextResponse.json({ error: "מזהה פריט חסר" }, { status: 400 });
    }

    const existing = await prisma.chemicalInventory.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "פריט לא נמצא" }, { status: 404 });
    }

    const updated = await prisma.chemicalInventory.update({
      where: { id },
      data: {
        name: name || undefined,
        category: category || undefined,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit: unit || undefined,
        minThreshold: minThreshold !== undefined ? parseFloat(minThreshold) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        notes: notes !== undefined ? notes : undefined,
        addedDate: addedDate ? new Date(addedDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, chemical: updated });
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
      return NextResponse.json({ error: "מזהה פריט חסר" }, { status: 400 });
    }

    await prisma.chemicalInventory.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
