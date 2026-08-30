const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.waterLog.findMany();
  const inventory = await prisma.chemicalInventory.findMany();

  for (const log of logs) {
    const steps = [];
    const followUpRequirements = [];
    const preventionGuidelines = [];
    let rootCauseAnalysis = "המים נבדקו ונמצאו בפרמטרים תקינים.";

    // Check alkalinity
    if (typeof log.alkalinity === "number" && log.alkalinity < 80) {
      const matched = inventory.find(
        (i) => i.category === "PH_PLUS" || i.name.includes("בסיסיות") || i.name.toLowerCase().includes("alka")
      );
      steps.push({
        stepNumber: steps.length + 1,
        stepType: "ROOT_CAUSE",
        title: "טיפול שורש 1: העלאת וייצוב בסיסיות המים (Total Alkalinity)",
        chemical: "מעלה בסיסיות (Alkalinity Increaser / סודיום ביקרבונט)",
        amount: "108 גרם",
        instructions: "הבסיסיות (TA) היא \"כרית האוויר\" שמייצבת את ה-pH. הוסף כ-108 גרם מעלה בסיסיות מומסים בדלי מים כשהג'טים פועלים לייצוב ה-pH ומניעת תנודות חומציות ושחיקת מתכות.",
        safetyWarning: "איזון הבסיסיות הוא צעד ראשון והכרחי לפני כל ניסיון לכוון את ה-pH.",
        inInventory: !!matched,
        inventoryItemName: matched ? matched.name : undefined,
        inventoryRemaining: matched ? `${matched.quantity} ${matched.unit}` : undefined,
        searchKeywords: "מעלה בסיסיות לג'קוזי Alka Plus סודיום ביקרבונט",
        buyRecommendation: "חפש ברשת: 'מעלה בסיסיות לג'קוזי' או 'Alka Plus / Alkalinity Increaser'",
      });

      followUpRequirements.push("בדוק מקלון בעוד 12 שעות לוודא שהבסיסיות (TA) עלתה לטווח היעד (80-120 ppm).");
      preventionGuidelines.push("שמור על רמת TA של 80-120 ppm למניעת קצף ותנודות חומציות פתאומיות.");
    }

    // Check foamy
    if (log.waterClarity === "FOAMY") {
      rootCauseAnalysis =
        "שורש הבעיה של קצף במים: קצף נוצר משומני גוף, סבונים, קרמים ושאריות חומרי כביסה בבגדי ים, בשילוב עם בסיסיות (TA) נמוכה. מסיר קצף (Anti-Foam) הוא סיליקון שמפוצץ בועות באופן זמני אך נשאר במים ועלול לסתום את הפילטר. כדי לפתור את הבעיה מהשורש יש לחמצן את השומנים בשוק ולשטוף את הפילטר.";

      // Root cause 2: Shock
      const matchedShock = inventory.find(
        (i) => i.category === "SHOCK" || i.name.includes("שוק") || i.name.toLowerCase().includes("mps")
      );
      steps.push({
        stepNumber: steps.length + 1,
        stepType: "ROOT_CAUSE",
        title: "טיפול שורש 2: שוק מחמצן (MPS) לפירוק שומנים וסבונים",
        chemical: "אבקת שוק מחמצן ללא כלור (Non-Chlorine Shock / MPS)",
        amount: "20 גרם",
        instructions: "הוסף 20 גרם של שוק מחמצן עם מכסה פתוח ומשאבות פועלות. חומר השוק \"שורף\" ומפרק את התרכובות האורגניות והסבונים שגרמו לקצף, במקום רק לכסות אותם.",
        safetyWarning: "השאר את המכסה פתוח למשך 30 דקות לאוורור גזים מחומצנים.",
        inInventory: !!matchedShock,
        inventoryItemName: matchedShock ? matchedShock.name : undefined,
        inventoryRemaining: matchedShock ? `${matchedShock.quantity} ${matchedShock.unit}` : undefined,
        searchKeywords: "שוק ללא כלור לג'קוזי Non Chlorine Shock MPS",
        buyRecommendation: "חפש ברשת: 'שוק ללא כלור לג'קוזי' (MPS / Non-Chlorine Shock)",
      });

      // Immediate Relief
      const matchedFoam = inventory.find(
        (i) => i.category === "ANTI_FOAM" || i.name.includes("קצף") || i.name.toLowerCase().includes("foam")
      );
      steps.push({
        stepNumber: steps.length + 1,
        stepType: "IMMEDIATE_RELIEF",
        title: "מענה מיידי (אופציונלי): מסיר קצף נקודתי",
        chemical: "חומר מונע קצף (Anti-Foam / Defoamer)",
        amount: "10-15 מ\"ל",
        instructions: "פזר כמות קטנה בלבד (פקק אחד) ישירות על הקצף לקבלת מים חלקים באותו הרגע.",
        safetyWarning: "זהירות: שימוש עודף במסיר קצף גורם למים שומניים וסותם את הפילטר. אין להוסיף יותר מהמינון המומלץ!",
        inInventory: !!matchedFoam,
        inventoryItemName: matchedFoam ? matchedFoam.name : undefined,
        inventoryRemaining: matchedFoam ? `${matchedFoam.quantity} ${matchedFoam.unit}` : undefined,
        searchKeywords: "מסיר קצף לג'קוזי Anti Foam Defoamer Spa",
        buyRecommendation: "חפש ברשת: 'מסיר קצף לג'קוזי' או 'Anti-Foam / Defoamer Spa'",
      });

      // Follow up step
      steps.push({
        stepNumber: steps.length + 1,
        stepType: "FOLLOW_UP",
        title: "פעולת חובה להמשך: שטיפת הפילטר בזרם מים תוך 24 שעות",
        chemical: "שטיפת פילטר במים (ללא חומר)",
        amount: "שטיפה בלחץ",
        instructions: "הוצא את פילטר הג'קוזי בעוד 24 שעות ושטוף אותו היטב בזרם מים חזק כדי להסיר את עודפי הסיליקון והשומנים שנלכדו בו.",
        inInventory: true,
      });

      followUpRequirements.push("חובה לשטוף את מסנן הג'קוזי בזרם מים חזק תוך 24-48 שעות להסרת עודפי סיליקון ושומנים.");
      preventionGuidelines.push("שטוף בגדי ים במים בלבד (ללא מרכך או אבקת כביסה במכונה) לפני כניסה לג'קוזי.");
      preventionGuidelines.push("הקפד על מקלחת קלה ללא סבונים כבדים או קרמים לפני הכניסה למים.");
    }

    if (steps.length === 0) {
      steps.push({
        stepNumber: 1,
        stepType: "ROOT_CAUSE",
        title: "תחזוקה שוטפת ושימור",
        chemical: "תחזוקה רגילה",
        amount: "לפי שגרה",
        instructions: "המים שלך במצב תקין ומאוזנים! המשך בבדיקה שבועית רגילה ושטיפת פילטר.",
        inInventory: true,
      });
    }

    const rec = {
      waterStatusSummary: log.aiDiagnosis || "רמת ה-pH והחיטוי מעולים ומאוזנים! נדרש טיפול נקודתי בנושא: הבסיסיות (TA) נמוכה, הקצפה במים.",
      rootCauseAnalysis,
      severity: "ATTENTION",
      safeToBathe: true,
      estimatedRecoveryTime: "1-2 שעות",
      stepByStepPlan: steps,
      followUpRequirements: followUpRequirements.length > 0 ? followUpRequirements : ["המשך בבדיקת מקלון שבועית רגילה."],
      preventionGuidelines: preventionGuidelines.length > 0 ? preventionGuidelines : [
        "הקפד על מקלחת קלה לפני כניסה למים.",
        "שטוף את מסנן הג'קוזי בזרם מים אחת לשבוע.",
      ],
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

  console.log("Successfully migrated existing water test logs with root cause, follow-up, and prevention rules!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
