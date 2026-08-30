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

export interface DiagnoseRequest {
  volumeLiters: number;
  sanitizationType: string;
  waterClarity: string;
  description?: string;
  ph?: number;
  freeChlorine?: number;
  alkalinity?: number;
  lastRefillDate?: string | Date;
  imageBase64?: string;
  imageMimeType?: string;
  inventory?: Array<{ name: string; category: string; quantity: number; unit: string }>;
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

export async function analyzeWaterWithGemini(data: DiagnoseRequest): Promise<DiagnosisResponse> {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `אתה מומחה בינלאומי בכיר בכימיה ותחזוקת מי ג'קוזי וספא (Jacuzzi Water Specialist).
נתוני הג'קוזי:
- נפח המים: ${data.volumeLiters} ליטר.
- שיטת חיטוי: ${data.sanitizationType} (כלור / ברום / מלח / חמצן פעיל).
- תאריך מילוי מים אחרון: ${data.lastRefillDate || "לא צוין"}.
- צלילות המים המדווחת: ${data.waterClarity} (CLEAR / SLIGHTLY_CLOUDY / VERY_CLOUDY / GREEN / FOAMY / BAD_ODOR).
- ערכי בדיקה: pH = ${data.ph ?? "לא נבדק"}, כלור חופשי = ${data.freeChlorine ?? "לא נבדק"} ppm, אלקליניות (Alkalinity) = ${data.alkalinity ?? "לא נבדק"} ppm.
- תיאור המשתמש: "${data.description || "ללא תיאור מיוחד"}".
- חומרים הקיימים במלאי המשתמש: ${JSON.stringify(data.inventory || [])}.

משימה:
נתח את מצב המים, הערך האם בטוח להתרחץ כרגע, תן מינונים מדויקים בגרם/מ"ל המותאמים בדיוק לנפח ${data.volumeLiters} ליטר, והצג תוכנית טיפול צעד-אחר-צעד בעברית ברורה.

החזר אך ורק תשובת JSON תקנית במבנה הבא (ללא טקסט מקדים או סיומת markdown חוץ מ-json block):
{
  "waterStatusSummary": "סיכום תמציתי של מצב המים",
  "severity": "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL",
  "safeToBathe": true | false,
  "needsFullDrain": true | false,
  "estimatedRecoveryTime": "למשל: שעתיים / 24 שעות",
  "stepByStepPlan": [
    {
      "stepNumber": 1,
      "title": "כותרת הפעולה",
      "chemical": "שם החומר הנדרש",
      "amount": "מינון מדויק ל-${data.volumeLiters} ליטר (למשל: 25 גרם)",
      "instructions": "הוראות יישום מפורטות ובטיחותיות",
      "safetyWarning": "אזהרת בטיחות (אם יש)"
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

  // Fallback rule-based inventory analysis
  return generateRuleBasedInventoryAnalysis(inventory);
}

function generateRuleBasedDiagnosis(data: DiagnoseRequest): DiagnosisResponse {
  const steps: DiagnosisResponse["stepByStepPlan"] = [];
  let severity: DiagnosisResponse["severity"] = "GOOD";
  let safeToBathe = true;
  let needsFullDrain = false;
  let estimatedRecoveryTime = "1-2 שעות";

  let stepCount = 1;

  // 1. Check pH
  if (data.ph !== undefined && data.ph !== null) {
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

  // 2. Check Sanitizer / Chlorine
  if (data.freeChlorine !== undefined && data.freeChlorine !== null) {
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
          safetyWarning: "המתן 20 דקות עם מכסה פתוח לפני כניסה למים.",
        });
      }
    } else if (data.freeChlorine > 8.0) {
      severity = "WARNING";
      safeToBathe = false;
      steps.push({
        stepNumber: stepCount++,
        title: "רמת כלור גבוהה מדי",
        chemical: "אוורור וקרני שמש / החלפה חלקית",
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
      instructions: "פזר ישירות על הקצף בזמן שהג'טים פועלים. הקצף ייעלם תוך שניות. אם הקצף חוזר, שקול שטיפת פילטר.",
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
      instructions: "המים שלך במצב תקין ומאוזן! המשך בבדיקה שבועית רגילה ושטיפת פילטר.",
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
    stepByStepPlan: steps,
    generalTips: [
      "זכור תמיד לשטוף את הפילטר אחת לשבוע כדי לאפשר סירקולציה וחיטוי יעיל.",
      "מומלץ להיכנס לג'קוזי ללא קרמים, שמנים או שאריות סבון כדי למנוע היווצרות קצף ועכירות.",
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
