const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.waterLog.findMany();
  const inventory = await prisma.chemicalInventory.findMany();

  for (const log of logs) {
    const steps = [];

    // Check alkalinity
    if (typeof log.alkalinity === "number" && log.alkalinity < 80) {
      const matched = inventory.find(
        (i) => i.category === "PH_PLUS" || i.name.includes("בסיסיות") || i.name.toLowerCase().includes("alka")
      );
      steps.push({
        stepNumber: steps.length + 1,
        title: "העלאת וייצוב בסיסיות המים (Total Alkalinity)",
        chemical: "מעלה בסיסיות (Alkalinity Increaser / סודיום ביקרבונט)",
        amount: "108 גרם",
        instructions: "הוסף כ-108 גרם מעלה בסיסיות מומסים בדלי מים כשהג'טים פועלים לייצוב ה-pH ומניעת תנודות חומציות.",
        inInventory: !!matched,
        inventoryItemName: matched ? matched.name : undefined,
        inventoryRemaining: matched ? `${matched.quantity} ${matched.unit}` : undefined,
        searchKeywords: "מעלה בסיסיות לג'קוזי Alka Plus סודיום ביקרבונט",
        buyRecommendation: "חפש ברשת: 'מעלה בסיסיות לג'קוזי' או 'Alka Plus / Alkalinity Increaser'",
      });
    }

    // Check foamy
    if (log.waterClarity === "FOAMY") {
      const matched = inventory.find(
        (i) => i.category === "ANTI_FOAM" || i.name.includes("קצף") || i.name.toLowerCase().includes("foam")
      );
      steps.push({
        stepNumber: steps.length + 1,
        title: "הסרת קצף ושומנים",
        chemical: "חומר מונע קצף (Anti-Foam / Defoamer)",
        amount: "15-20 מ\"ל",
        instructions: "פזר ישירות על הקצף בזמן שהג'טים פועלים. הקצף ייעלם תוך שניות.",
        inInventory: !!matched,
        inventoryItemName: matched ? matched.name : undefined,
        inventoryRemaining: matched ? `${matched.quantity} ${matched.unit}` : undefined,
        searchKeywords: "מסיר קצף לג'קוזי Anti Foam Defoamer Spa",
        buyRecommendation: "חפש ברשת: 'מסיר קצף לג'קוזי' או 'Anti-Foam / Defoamer Spa'",
      });
    }

    if (steps.length === 0) {
      steps.push({
        stepNumber: 1,
        title: "תחזוקה שוטפת ושימור",
        chemical: "תחזוקה רגילה",
        amount: "לפי שגרה",
        instructions: "המים שלך במצב תקין ומאוזנים! המשך בבדיקה שבועית רגילה ושטיפת פילטר.",
        inInventory: true,
      });
    }

    const rec = {
      waterStatusSummary: log.aiDiagnosis || "רמת ה-pH והחיטוי מעולים ומאוזנים! נדרש טיפול נקודתי בנושא: הבסיסיות (TA) נמוכה, הקצפה במים.",
      severity: "ATTENTION",
      safeToBathe: true,
      estimatedRecoveryTime: "1-2 שעות",
      stepByStepPlan: steps,
      generalTips: [
        "זכור לשטוף את הפילטר אחת לשבוע כדי לאפשר סירקולציה וחיטוי יעיל.",
        "הקפד על רמת בסיסיות (TA) של 80-120 כדי לשמור על יציבות ה-pH.",
      ],
    };

    await prisma.waterLog.update({
      where: { id: log.id },
      data: {
        aiDiagnosis: rec.waterStatusSummary,
        aiRecommendations: JSON.stringify(rec),
      },
    });
  }

  console.log("Successfully migrated existing water test logs with rich recommendations & search buttons!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
