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

    // Clean previous purchase tasks from maintenance task list
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

    if (allRecommendedPurchases.length > 0) {
      await prisma.diaryEntry.create({
        data: {
          userId: user.id,
          title: "בדיקת חומרים חסרים AI בארון החומרים",
          content: `חומרים מומלצים לרכש: ${allRecommendedPurchases.join(", ")}.\n${analysis.inventorySummary || ""}`,
          entryDate: new Date(),
          waterQualityRating: 5,
        },
      });
    } else {
      await prisma.diaryEntry.create({
        data: {
          userId: user.id,
          title: "בדיקת חומרים חסרים AI בארון החומרים",
          content: `בוצעה בדיקת AI: ארון החומרים מלא ותקין, אין חוסרים לרכש.`,
          entryDate: new Date(),
          waterQualityRating: 5,
        },
      });
    }

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
