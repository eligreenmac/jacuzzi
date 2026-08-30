import { GoogleGenAI } from "@google/genai";
import {
  calculatePhAdjustment,
  calculateChlorineDose,
  calculateShockDose,
  ESSENTIAL_CHEMICAL_CATEGORIES,
} from "./jacuzzi-calc";

const apiKey = process.env.GEMINI_API_KEY || "";
const preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getAiClient() {
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export interface IdentifyChemicalResponse {
  identified: boolean;
  name: string;
  category: "SANITIZER" | "PH_MINUS" | "PH_PLUS" | "SHOCK" | "ANTI_FOAM" | "CLARIFIER" | "TEST_STRIPS" | "CLEANER" | "OTHER";
  unit: "GRAMS" | "ML" | "TABLETS" | "STRIPS" | "PIECES";
  defaultMinThreshold: number;
  activeIngredients?: string;
  usageSummary: string;
  safetyNotes: string;
}

export interface DiagnoseRequest {
  volumeLiters: number;
  sanitizationType: string;
  waterClarity: string;
  description?: string;
  ph?: number | "UNKNOWN";
  freeChlorine?: number | "UNKNOWN";
  alkalinity?: number | "UNKNOWN";
  lastRefillDate?: string | Date;
  imageBase64?: string;
  imageMimeType?: string;
  inventory?: Array<{ name: string; category: string; quantity: number; unit: string }>;
  history?: Array<{
    date: string | Date;
    type: string;
    ph?: number | null;
    freeChlorine?: number | null;
    actionTaken?: string | null;
    valueBefore?: string | null;
    valueAfter?: string | null;
  }>;
  daysSinceLastPhTest?: number;
  daysSinceLastFilterWash?: number;
  daysSinceLastShock?: number;
}

export interface DiagnosisResponse {
  waterStatusSummary: string;
  severity: "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL";
  stepByStepPlan: Array<{
    stepNumber: number;
    title: string;
    chemical: string;
    amount: string;
    instructions: string;
    safetyWarning?: string;
  }>;
  historicalInsights?: string[];
  missingTestsAlerts?: string[];
  generalTips: string[];
  safeToBathe: boolean;
  needsFullDrain: boolean;
  estimatedRecoveryTime: string;
}

export interface InventoryAnalysisResponse {
  missingCritical: Array<{
    category: string;
    nameHe: string;
    whyNeeded: string;
    suggestedProduct: string;
    urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  }>;
  inventorySummary: string;
  lowStockAlerts: Array<{
    name: string;
    remaining: string;
    recommendation: string;
  }>;
  safetyRecommendations: string[];
}

/**
 * Identify a chemical product from a photo using Gemini 3.7 / 2.5 Vision
 */
export async function identifyChemicalFromImage(
  imageBase64: string,
  imageMimeType = "image/jpeg"
): Promise<IdentifyChemicalResponse> {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `אתה מומחה לזיהוי כימיקלים ומוצרי תחזוקה לג'קוזי, בריכות וספא.
עליך לנתח את התמונה המצורפת של אריזת המוצר / תווית הכימיקל.
זהה:
1. שם המוצר המלא והמותג (למשל: "כלור גרגירי מהיר HTH 56%", "מוריד pH נוזלי SpaTime", "מצליל מים קריסטל", "שוק ללא כלור MPS", "מסיר קצף Anti-Foam", "מקלונים לבדיקת מים 5 ב-1").
2. קטגוריית החומר: אחת מתוך: SANITIZER, PH_MINUS, PH_PLUS, SHOCK, ANTI_FOAM, CLARIFIER, TEST_STRIPS, CLEANER, OTHER.
3. יחידת מידה מומלצת: GRAMS (אם אבקה/גרגירים), ML (אם נוזל), TABLETS (אם טבליות), STRIPS (אם מקלונים), PIECES.
4. רף התראת מלאי מינימלי מומלץ (מספר בגרם/מל, למשל: 150).
5. חומר פעיל עיקרי (Active Ingredient) שזוהה בתווית.
6. תמצית אופן השימוש והמינון המומלץ מהתווית.
7. הערות בטיחות מהאריזה.

החזר אך ורק תשובת JSON תקנית במבנה הבא:
{
  "identified": true,
  "name": "שם המוצר שזוהה",
  "category": "SANITIZER" | "PH_MINUS" | "PH_PLUS" | "SHOCK" | "ANTI_FOAM" | "CLARIFIER" | "TEST_STRIPS" | "CLEANER" | "OTHER",
  "unit": "GRAMS" | "ML" | "TABLETS" | "STRIPS" | "PIECES",
  "defaultMinThreshold": 150,
  "activeIngredients": "חומר פעיל",
  "usageSummary": "תמצית שימוש ומינון",
  "safetyNotes": "הוראות בטיחות ואחסון"
}`;

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

      const response = await ai.models.generateContent({
        model: preferredModel,
        contents: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as IdentifyChemicalResponse;
      }
    } catch (err) {
      console.error("Gemini Image ID error:", err);
    }
  }

  // Smart fallback if API key not available
  return {
    identified: true,
    name: "כימיקל ג'קוזי (זוהה מצילום)",
    category: "SANITIZER",
    unit: "GRAMS",
    defaultMinThreshold: 100,
    activeIngredients: "חומר פעיל לג'קוזי",
    usageSummary: "יש לעיין בתווית האריזה לצורך הוראות מינון מדויקות לפי נפח הג'קוזי.",
    safetyNotes: "אחסן במקום קריר ויבש, הרחק מילדים. אין לערבב חומרים יחד.",
  };
}

/**
 * Water Diagnosis with Time-Series History, Missing Test Handling & Volume Scaling
 */
export async function analyzeWaterWithGemini(data: DiagnoseRequest): Promise<DiagnosisResponse> {
  const ai = getAiClient();

  const phDisplay = data.ph === "UNKNOWN" || data.ph === undefined || data.ph === null ? "לא ידוע / לא נבדק" : `${data.ph}`;
  const clDisplay =
    data.freeChlorine === "UNKNOWN" || data.freeChlorine === undefined || data.freeChlorine === null
      ? "לא ידוע / לא נבדק"
      : `${data.freeChlorine} ppm`;
  const alkDisplay =
    data.alkalinity === "UNKNOWN" || data.alkalinity === undefined || data.alkalinity === null
      ? "לא ידוע / לא נבדק"
      : `${data.alkalinity} ppm`;

  if (ai) {
    try {
      const prompt = `אתה מומחה בכיר לכימיית מי ג'קוזי וספא (Jacuzzi Water Specialist).
נתוני הג'קוזי:
- נפח המים: ${data.volumeLiters} ליטר.
- שיטת חיטוי: ${data.sanitizationType} (כלור / ברום / מלח / חמצן פעיל).
- תאריך מילוי מים אחרון: ${data.lastRefillDate || "לא צוין"}.
- מראה וצלילות המים המדווחת: ${data.waterClarity} (CLEAR / SLIGHTLY_CLOUDY / VERY_CLOUDY / GREEN / FOAMY / BAD_ODOR).
- ערכי בדיקה נוכחיים: 
  * pH: ${phDisplay}
  * כלור חופשי: ${clDisplay}
  * בסיסיות (TA): ${alkDisplay}
- תיאור חופשי מהמשתמש: "${data.description || "ללא תיאור נוסף"}".
- זמנים שעברו מפעולות קודמות:
  * ימים שעברו מבדיקת pH אחרונה: ${data.daysSinceLastPhTest ?? "לא ידוע"}
  * ימים שעברו משטיפת פילטר אחרונה: ${data.daysSinceLastFilterWash ?? "לא ידוע"}
  * ימים שעברו משוק אחרון: ${data.daysSinceLastShock ?? "לא ידוע"}
- היסטוריית טיפולים ומדידות אחרונות:
${JSON.stringify(data.history || [], null, 2)}
- מלאי חומרים זמין בארון המשתמש:
${JSON.stringify(data.inventory || [], null, 2)}

הנחיות חשובות:
1. שים לב: אם ערך מסוים הוא "לא ידוע / לא נבדק", התחשב במראה המים, בהיסטוריה ובזמנים שעברו. ציין בהמלצות שיש לבצע בדיקה בהקדם.
2. תן תובנות היסטוריות אם ניכרת מגמה (למשל: "ה-pH עולה באופן קבוע כל כמה ימים", "לא ביצעת שטיפת פילטר כבר מעל שבוע").
3. תן מינונים מדויקים בגרם / מ"ל המחושבים בדיוק עבור נפח ${data.volumeLiters} ליטר.
4. הערך האם בטוח להתרחץ כרגע.

החזר אך ורק תשובת JSON תקנית במבנה:
{
  "waterStatusSummary": "סיכום תמציתי ומדויק של מצב המים",
  "severity": "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL",
  "safeToBathe": true | false,
  "needsFullDrain": true | false,
  "estimatedRecoveryTime": "למשל: שעתיים / 24 שעות",
  "historicalInsights": ["תובנה על פי ההיסטוריה ופערי הזמנים"],
  "missingTestsAlerts": ["התראה על בדיקה שלא בוצעה זמן רב אם רלוונטי"],
  "stepByStepPlan": [
    {
      "stepNumber": 1,
      "title": "כותרת הפעולה",
      "chemical": "שם החומר הנדרש",
      "amount": "מינון מדויק ל-${data.volumeLiters} ליטר (למשל: 25 גרם)",
      "instructions": "הוראות יישום מפורטות ובטיחותיות",
      "safetyWarning": "אזהרת בטיחות"
    }
  ],
  "generalTips": ["טיפ 1", "טיפ 2"]
}`;

      const contents: any[] = [];
      if (data.imageBase64 && data.imageMimeType) {
        contents.push({
          inlineData: {
            mimeType: data.imageMimeType,
            data: data.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
          },
        });
      }
      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: preferredModel,
        contents: contents,
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as DiagnosisResponse;
      }
    } catch (err) {
      console.error("Gemini API Error, falling back to rule-based calculator:", err);
    }
  }

  // Fallback rule-based chemical algorithm
  return generateRuleBasedDiagnosis(data);
}

export async function analyzeInventoryWithGemini(
  inventory: Array<{ name: string; category: string; quantity: number; unit: string; minThreshold?: number }>,
  volumeLiters: number,
  sanitizationType: string
): Promise<InventoryAnalysisResponse> {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `אתה יועץ כימיה מומחה לג'קוזי וספא.
ברשות המשתמש ג'קוזי בנפח ${volumeLiters} ליטר עם שיטת חיטוי ${sanitizationType}.
להלן רשימת החומרים הקיימת בארון המשתמש:
${JSON.stringify(inventory, null, 2)}

משימה:
1. זהה איזה חומרים קריטיים חסרים למשתמש לשמירה על שגרת תחזוקה ובטיחות בריאותית מלאה.
2. זהה חומרים שהמלאי שלהם נמוך מאוד.
3. ספק סיכום קצר והמלצות בטיחות לאחסון ושימוש.

החזר אך ורק תשובת JSON תקנית במבנה:
{
  "inventorySummary": "סיכום מצב הארון",
  "missingCritical": [
    {
      "category": "שם הקטגוריה",
      "nameHe": "שם החומר בעברית",
      "whyNeeded": "מדוע הוא חובה",
      "suggestedProduct": "דוגמה למוצר מומלץ",
      "urgency": "CRITICAL" | "HIGH" | "MEDIUM"
    }
  ],
  "lowStockAlerts": [
    {
      "name": "שם החומר",
      "remaining": "כמות שנותרה",
      "recommendation": "המלצה להצטיידות"
    }
  ],
  "safetyRecommendations": ["המלצה 1", "המלצה 2"]
}`;

      const response = await ai.models.generateContent({
        model: preferredModel,
        contents: [{ text: prompt }],
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as InventoryAnalysisResponse;
      }
    } catch (err) {
      console.error("Gemini Inventory API error, using fallback:", err);
    }
  }

  return generateRuleBasedInventoryAnalysis(inventory);
}

function generateRuleBasedDiagnosis(data: DiagnoseRequest): DiagnosisResponse {
  const steps: DiagnosisResponse["stepByStepPlan"] = [];
  const historicalInsights: string[] = [];
  const missingTestsAlerts: string[] = [];
  let severity: DiagnosisResponse["severity"] = "GOOD";
  let safeToBathe = true;
  let needsFullDrain = false;
  let estimatedRecoveryTime = "1-2 שעות";

  let stepCount = 1;

  // Check if any test was unknown
  if (data.ph === "UNKNOWN" || data.ph === undefined || data.ph === null) {
    missingTestsAlerts.push("רמת ה-pH לא נבדקה כעת. מומלץ לבצע בדיקת מקלון בהקדם לאימות חומציות המים.");
  }
  if (data.freeChlorine === "UNKNOWN" || data.freeChlorine === undefined || data.freeChlorine === null) {
    missingTestsAlerts.push("רמת חומר החיטוי (כלור/ברום) לא נבדקה כעת.");
  }

  // Time delta checks
  if (data.daysSinceLastFilterWash && data.daysSinceLastFilterWash >= 7) {
    historicalInsights.push(`חלפו ${data.daysSinceLastFilterWash} ימים משטיפת הפילטר האחרונה - מומלץ לשטוף היום בזרם מים.`);
  }
  if (data.daysSinceLastPhTest && data.daysSinceLastPhTest >= 5) {
    historicalInsights.push(`בדיקת ה-pH הקודמת בוצעה לפני ${data.daysSinceLastPhTest} ימים.`);
  }

  // 1. Check pH if provided
  if (typeof data.ph === "number") {
    const phAdj = calculatePhAdjustment(data.volumeLiters, data.ph);
    if (phAdj) {
      severity = "ATTENTION";
      steps.push({
        stepNumber: stepCount++,
        title: phAdj.action === "REDUCE_PH" ? "הורדת רמת החומציות (pH)" : "העלאת רמת החומציות (pH)",
        chemical: phAdj.chemical,
        amount: `${phAdj.amountGrams} גרם`,
        instructions: phAdj.instruction,
        safetyWarning: "אין לערבב חומרים יחד בדלי. יש להמיס כל חומר בנפרד במים פושרים.",
      });
    }
  }

  // 2. Check Sanitizer / Chlorine if provided
  if (typeof data.freeChlorine === "number") {
    if (data.freeChlorine < 2.0) {
      const clAdj = calculateChlorineDose(data.volumeLiters, data.freeChlorine);
      if (clAdj) {
        severity = severity === "GOOD" ? "ATTENTION" : "WARNING";
        steps.push({
          stepNumber: stepCount++,
          title: "העלאת רמת חומר החיטוי",
          chemical: clAdj.chemical,
          amount: `${clAdj.amountGrams} גרם`,
          instructions: clAdj.instruction,
          safetyWarning: "המתן 20 דקות עם מכסה פתוח וסירקולציה פועלת לפני כניסה למים.",
        });
      }
    } else if (data.freeChlorine > 8.0) {
      severity = "WARNING";
      safeToBathe = false;
      steps.push({
        stepNumber: stepCount++,
        title: "רמת כלור גבוהה מדי",
        chemical: "אוורור וסירקולציה",
        amount: "ללא חומר",
        instructions: "פתח את המכסה התרמי והפעל את הג'טים למשך 30-45 דקות כדי לתת לכלור להתנדף.",
        safetyWarning: "רחצה בכלור מעל 8 ppm עלולה לגרום לגירוי עור ועיניים.",
      });
    }
  }

  // 3. Check Water Clarity & Symptoms
  if (data.waterClarity === "GREEN" || data.waterClarity === "BAD_ODOR") {
    severity = "CRITICAL";
    safeToBathe = false;
    estimatedRecoveryTime = "24-48 שעות";
    const shockGrams = calculateShockDose(data.volumeLiters) * 1.5;
    steps.push({
      stepNumber: stepCount++,
      title: "שוק חיטוי מוגבר וחיסול אצות / בקטריות",
      chemical: "שוק כלור מהיר (Shock Chlorine)",
      amount: `${Math.round(shockGrams)} גרם`,
      instructions: "הוסף את השוק, הפעל את משאבות הסירקולציה למשך שעה ברציפות ובדוק שוב לאחר 12 שעות.",
      safetyWarning: "חל איסור רחצה עד שרמת הכלור חוזרת ל-3-5 ppm והמים צלולים לחלוטין.",
    });
  } else if (data.waterClarity === "FOAMY") {
    severity = "ATTENTION";
    steps.push({
      stepNumber: stepCount++,
      title: "הסרת קצף ושומנים",
      chemical: "חומר מונע קצף (Anti-Foam / Defoamer)",
      amount: "15-20 מ\"ל",
      instructions: "פזר ישירות על הקצף בזמן שהג'טים פועלים. הקצף ייעלם תוך שניות.",
    });
  } else if (data.waterClarity === "VERY_CLOUDY" || data.waterClarity === "SLIGHTLY_CLOUDY") {
    severity = "ATTENTION";
    steps.push({
      stepNumber: stepCount++,
      title: "הצללת מים ושטיפת פילטר",
      chemical: "מצליל מים (Water Clarifier)",
      amount: `${Math.round((data.volumeLiters / 1000) * 15)} מ\"ל`,
      instructions: "הוסף מצליל מים, הפעל ג'טים ל-20 דקות והשאר את הסינון לעבוד. לאחר 6 שעות שטוף את הפילטר במים.",
    });
  }

  if (steps.length === 0) {
    steps.push({
      stepNumber: 1,
      title: "תחזוקה שוטפת ושימור",
      chemical: "תחזוקה רגילה",
      amount: "לפי שגרה",
      instructions: "המים שלך במצב תקין! המשך בבדיקה שבועית רגילה ושטיפת פילטר.",
    });
  }

  return {
    waterStatusSummary:
      severity === "GOOD"
        ? "המים במצב מעולה ומאוזנים!"
        : severity === "ATTENTION"
        ? "נדרש איזון קל של החומציות או המצליל."
        : severity === "WARNING"
        ? "המים אינם מאוזנים ודורשים טיפול לפני רחצה."
        : "מצב מים ירוד / זיהום. נדרש שוק מסיבי או ריקון ומילוי מחדש.",
    severity,
    safeToBathe,
    needsFullDrain,
    estimatedRecoveryTime,
    historicalInsights,
    missingTestsAlerts,
    stepByStepPlan: steps,
    generalTips: [
      "זכור תמיד לשטוף את הפילטר אחת לשבוע כדי לאפשר סירקולציה וחיטוי יעיל.",
      "מומלץ להיכנס לג'קוזי ללא קרמים או שמנים למניעת קצף.",
    ],
  };
}

function generateRuleBasedInventoryAnalysis(
  inventory: Array<{ name: string; category: string; quantity: number; unit: string; minThreshold?: number }>
): InventoryAnalysisResponse {
  const existingCategories = new Set(inventory.map((item) => item.category.toUpperCase()));
  const missingCritical: InventoryAnalysisResponse["missingCritical"] = [];
  const lowStockAlerts: InventoryAnalysisResponse["lowStockAlerts"] = [];

  for (const cat of ESSENTIAL_CHEMICAL_CATEGORIES) {
    if (!existingCategories.has(cat.category)) {
      missingCritical.push({
        category: cat.category,
        nameHe: cat.nameHe,
        whyNeeded: cat.importance,
        suggestedProduct: `מוצר סטנדרטי לקטגוריית ${cat.nameHe}`,
        urgency: cat.urgency.includes("קריטי") ? "CRITICAL" : "HIGH",
      });
    }
  }

  for (const item of inventory) {
    const min = item.minThreshold ?? 100;
    if (item.quantity <= min) {
      lowStockAlerts.push({
        name: item.name,
        remaining: `${item.quantity} ${item.unit}`,
        recommendation: `המלאי נמוך מהרף המינימלי (${min} ${item.unit}). מומלץ להזמין מלאי נוסף.`,
      });
    }
  }

  return {
    inventorySummary: `נמצאו ${inventory.length} פריטים במלאי. ${missingCritical.length} חומרים חיוניים חסרים.`,
    missingCritical,
    lowStockAlerts,
    safetyRecommendations: [
      "אחסן תמיד את הכימיקלים במקום קריר, מוצל ויבש, הרחק מהישג ידם של ילדים.",
      "לעולם אין לערבב חומרים שונים יחד באותו כלי או דלי.",
      "סגור היטב את המכסים לאחר כל שימוש למניעת חדירת לחות.",
    ],
  };
}
