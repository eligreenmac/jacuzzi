import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const rawEntries = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { entryDate: "desc" },
    });

    // Only return real manual user notes / completed maintenance actions (no auto-generated water test text notes)
    const entries = rawEntries.filter(
      (e) =>
        !e.title.includes("בדיקת איכות מים (מקלון)") &&
        !e.title.includes("בוצע: בדיקת מים") &&
        !e.content.includes("בוצעה בדיקת מים דרך לשונית")
    );

    const waterLogs = await prisma.waterLog.findMany({
      where: { userId: user.id },
      orderBy: { testedAt: "desc" },
    });

    return NextResponse.json({ entries, waterLogs });
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
      imageUrl,
      entryDate,
      chemicalsAdded,
      valueBefore,
      valueAfter,
      waterQualityRating,
      chemicalInventoryId,
      deductAmount,
    } = await req.json();

    const finalTitle = (title || content?.slice(0, 40) || "הערה ביומן").trim();

    if (!content) {
      return NextResponse.json({ error: "תוכן ההערה הוא שדה חובה" }, { status: 400 });
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
        title: finalTitle,
        content,
        imageUrl: imageUrl || null,
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

    const entry = await prisma.diaryEntry.findFirst({
      where: { id, userId: user.id },
    });

    const userChems = await prisma.chemicalInventory.findMany({
      where: { userId: user.id },
    });

    if (entry) {
      // 🌟 Restore deducted chemicals to inventory
      const fullText = `${entry.title || ""} ${entry.content || ""} ${entry.chemicalsAdded || ""}`;

      for (const chem of userChems) {
        if (fullText.includes(chem.name) || (entry.chemicalsAdded && entry.chemicalsAdded.includes(chem.name))) {
          const chemEscaped = chem.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexPatterns = [
            new RegExp(`(?:הוספת|שימוש ב-?|מינון:?)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:מ"?ל|גרם|גר'?|טבליות|יחידות)?\\s*(?:של)?\\s*${chemEscaped}`, "i"),
            new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:מ"?ל|גרם|גר'?|טבליות|יחידות)?\\s*(?:של)?\\s*${chemEscaped}`, "i"),
            new RegExp(`${chemEscaped}[^0-9]*(\\d+(?:\\.\\d+)?)`, "i"),
          ];

          let amountToRestore = 0;
          for (const regex of regexPatterns) {
            const match = fullText.match(regex);
            if (match) {
              const num = parseFloat(match[1] || "0");
              if (num > 0 && num <= 10000) {
                amountToRestore = num;
                break;
              }
            }
          }

          if (amountToRestore === 0 && chem.lastUsedAmount && chem.lastUsedDate) {
            const entryTime = new Date(entry.entryDate || entry.createdAt).getTime();
            const chemTime = new Date(chem.lastUsedDate).getTime();
            if (Math.abs(entryTime - chemTime) < 24 * 3600 * 1000) {
              amountToRestore = chem.lastUsedAmount;
            }
          }

          if (amountToRestore > 0) {
            await prisma.chemicalInventory.update({
              where: { id: chem.id },
              data: {
                quantity: chem.quantity + amountToRestore,
                lastUsedDate: null,
                lastUsedAmount: null,
              },
            });
          }
        }
      }

      await prisma.diaryEntry.delete({
        where: { id: entry.id },
      });
    } else {
      // Check if id is a chemical ID (direct chemical addition cancellation)
      const matchingChem = userChems.find((c) => id.includes(c.id));
      if (matchingChem) {
        const usedAmount = matchingChem.lastUsedAmount || 0;
        await prisma.chemicalInventory.update({
          where: { id: matchingChem.id },
          data: {
            quantity: matchingChem.quantity + usedAmount,
            lastUsedDate: null,
            lastUsedAmount: null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, restocked: true });
  } catch (error: any) {
    console.error("Diary entry delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
