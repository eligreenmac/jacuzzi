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

    const entry = await prisma.diaryEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (entry) {
      // 🌟 Restore deducted chemicals to inventory
      const fullText = `${entry.title || ""} ${entry.content || ""} ${entry.chemicalsAdded || ""}`;
      const userChems = await prisma.chemicalInventory.findMany({
        where: { userId: user.id },
      });

      for (const chem of userChems) {
        if (fullText.includes(chem.name)) {
          // Extract the quantity associated with this chemical in the text
          // Example formats: "מוריד קצף (30 ML)" or "כלור גרגרים: 50 גרם" or "הוספת 30 ML מוריד קצף"
          const chemEscaped = chem.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexPatterns = [
            new RegExp(`${chemEscaped}[^0-9]*(\\d+(\\.\\d+)?)`, "i"),
            new RegExp(`(\\d+(\\.\\d+)?)[^0-9]*${chemEscaped}`, "i"),
          ];

          let amountToRestore = 0;
          for (const regex of regexPatterns) {
            const match = fullText.match(regex);
            if (match) {
              const num = parseFloat(match[1] || match[2] || "0");
              if (num > 0 && num <= 5000) {
                amountToRestore = num;
                break;
              }
            }
          }

          if (amountToRestore > 0) {
            await prisma.chemicalInventory.update({
              where: { id: chem.id },
              data: { quantity: chem.quantity + amountToRestore },
            });
          }
        }
      }

      // 🌟 Delete corresponding recurring maintenance tasks
      const taskOrConditions: any[] = [];
      const cleanTitle = (entry.title || "").replace("בוצע: ", "").replace("פעולת אחזקה יזומה: ", "").trim();
      if (cleanTitle.length > 2) {
        taskOrConditions.push({ title: { contains: cleanTitle } });
        taskOrConditions.push({ description: { contains: cleanTitle } });
      }

      for (const chem of userChems) {
        if (fullText.includes(chem.name)) {
          taskOrConditions.push({ title: { contains: chem.name } });
          taskOrConditions.push({ description: { contains: chem.name } });
        }
      }

      if (taskOrConditions.length > 0) {
        await prisma.maintenanceTask.deleteMany({
          where: {
            userId: user.id,
            OR: taskOrConditions,
          },
        });
      }

      await prisma.diaryEntry.delete({
        where: { id: entry.id },
      });
    }

    return NextResponse.json({ success: true, restocked: true });
  } catch (error: any) {
    console.error("Diary entry delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
