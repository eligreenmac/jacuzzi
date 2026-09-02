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

    // Collect all items recommended for purchase from AI analysis
    const missingItems = (analysis.missingCritical || []).map((m: any) => m.nameHe || m.suggestedProduct || m.category);
    const lowStockItems = (analysis.lowStockAlerts || []).map((l: any) => l.name);
    const allRecommendedPurchases = Array.from(new Set([...missingItems, ...lowStockItems])).filter(Boolean);

    // Clean previous purchase tasks and purchase diary entries from maintenance calendar/diary
    await prisma.maintenanceTask.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: "רכש מומלץ" } },
          { title: { contains: "רכש AI" } },
          { title: { contains: "רכש" } },
        ],
      },
    });

    await prisma.diaryEntry.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: "חומרים חסרים" } },
          { title: { contains: "רכש מומלץ" } },
          { content: { contains: "חומרים מומלצים לרכש" } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
      inventoryCount: inventory.length,
      recommendedPurchases: allRecommendedPurchases,
    });
  } catch (error: any) {
    console.error("Inventory check error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בבדיקת המלאי" }, { status: 500 });
  }
}
