import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const entries = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { entryDate: "desc" },
    });

    const waterLogs = await prisma.waterLog.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
    });

    // Make sure EVERY waterLog that does not have an existing diary entry is included in the entries array
    const synthesizedWaterTestEntries = waterLogs.map((w) => {
      const phStr = w.phRange || (w.ph !== null ? `pH ${w.ph}` : null);
      const clStr = w.chlorineRange || (w.freeChlorine !== null ? `${w.freeChlorine} ppm` : null);
      const alkStr = w.alkalinityRange || (w.alkalinity !== null ? `${w.alkalinity} ppm` : null);
      const valStr = [phStr && `חומציות: ${phStr}`, clStr && `חיטוי: ${clStr}`, alkStr && `בסיסיות: ${alkStr}`].filter(Boolean).join(", ") || "נבדק";

      return {
        id: "wlog-" + w.id,
        userId: user.id,
        title: "בדיקת איכות מים (מקלון)",
        content: `בוצעה בדיקת מים דרך לשונית בדיקות מים.\n• תוצאות: ${valStr}\n• צלילות: ${w.waterClarity || "צלול"}${w.description ? `\n• הערות: ${w.description}` : ""}${w.aiDiagnosis ? `\n• אבחון: ${w.aiDiagnosis}` : ""}`,
        entryDate: w.testedAt,
        valueAfter: valStr,
        chemicalsAdded: null,
        waterQualityRating: 5,
        isWaterTest: true,
        createdAt: w.createdAt,
        updatedAt: w.createdAt,
      };
    });

    // Merge entries avoiding duplicates on same timestamp (within 2 minutes)
    const combinedEntries = [...entries];
    for (const syn of synthesizedWaterTestEntries) {
      const synTime = new Date(syn.entryDate).getTime();
      const alreadyHasDiary = entries.some((e) => {
        const eTime = new Date(e.entryDate).getTime();
        return Math.abs(eTime - synTime) < 120000 && (e.title.includes("בדיק") || e.title.includes("מקלון"));
      });
      if (!alreadyHasDiary) {
        combinedEntries.push(syn as any);
      }
    }

    combinedEntries.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    return NextResponse.json({ entries: combinedEntries, waterLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const {
      title,
      content,
      entryDate,
      chemicalsAdded,
      valueBefore,
      valueAfter,
      waterQualityRating,
      chemicalInventoryId,
      deductAmount,
    } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "כותרת ותוכן הם שדות חובה" }, { status: 400 });
    }

    let finalChemicalString = chemicalsAdded || "";

    // Deduct from inventory if chosen
    if (chemicalInventoryId && deductAmount && parseFloat(deductAmount) > 0) {
      const chem = await prisma.chemicalInventory.findFirst({
        where: { id: chemicalInventoryId, userId: user.id },
      });

      if (chem) {
        const amountToDeduct = parseFloat(deductAmount);
        const newQuantity = Math.max(0, chem.quantity - amountToDeduct);

        await prisma.chemicalInventory.update({
          where: { id: chem.id },
          data: { quantity: newQuantity },
        });

        finalChemicalString = `${chem.name}: ${amountToDeduct} ${chem.unit === "GRAMS" ? 'גר\'' : chem.unit === "ML" ? 'מ"ל' : chem.unit}`;
      }
    }

    const entry = await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        title,
        content,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        chemicalsAdded: finalChemicalString || null,
        valueBefore: valueBefore || null,
        valueAfter: valueAfter || null,
        waterQualityRating: waterQualityRating ? parseInt(waterQualityRating, 10) : 5,
      },
    });

    return NextResponse.json({ success: true, entry });
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
      return NextResponse.json({ error: "מזהה רשומה חסר" }, { status: 400 });
    }

    await prisma.diaryEntry.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
