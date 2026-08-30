import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeInventoryWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    const inventory = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    const volumeLiters = jacuzzi?.volumeLiters || 1200;
    const sanitizationType = jacuzzi?.sanitizationType || "CHLORINE";

    const analysis = await analyzeInventoryWithGemini(
      inventory.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minThreshold: item.minThreshold,
      })),
      volumeLiters,
      sanitizationType
    );

    return NextResponse.json({
      success: true,
      analysis,
      inventoryCount: inventory.length,
    });
  } catch (error: any) {
    console.error("Inventory check error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בבדיקת המלאי" }, { status: 500 });
  }
}
