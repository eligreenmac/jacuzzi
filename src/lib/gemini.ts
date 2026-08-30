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

export interface ChemicalAdditionLedgerEntry {
  date: string | Date;
  chemical: string;
  amount?: string | null;
  valueBefore?: string | null;
  valueAfter?: string | null;
  notes?: string | null;
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
  addedChemicalsLedger?: ChemicalAdditionLedgerEntry[];
  daysSinceLastPhTest?: number;
  daysSinceLastFilterWash?: number;
  daysSinceLastShock?: number;
}

export interface DiagnosisStep {
  stepNumber: number;
  stepType?: "ROOT_CAUSE" | "IMMEDIATE_RELIEF" | "FOLLOW_UP";
  title: string;
  chemical: string;
  amount: string;
  instructions: string;
  safetyWarning?: string;
  inInventory?: boolean;
  inventoryItemName?: string;
  inventoryRemaining?: string;
  searchKeywords?: string;
  buyRecommendation?: string;
}

export interface DiagnosisResponse {
  waterStatusSummary: string;
  rootCauseAnalysis?: string;
  severity: "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL";
  stepByStepPlan: DiagnosisStep[];
  inventoryStatus?: {
    availableInCabinet: Array<{ name: string; neededAmount: string; remaining: string }>;
    missingToBuy: Array<{ name: string; searchKeywords: string; searchUrl: string; whyNeeded: string }>;
  };
  followUpRequirements?: string[];
  preventionGuidelines?: string[];
  recentAdditionsAnalysis?: string[];
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
1. שם המוצר המלא והמותג (למשל: "כלור גרגירי מהיר HTH 56%", "מוריד pH נוזלי SpaTime", "מצליל מים קריסטל", "שוק ללא כלור MPS", "מסיר קצף Anti-Foam", "מקלונים לבדיקת מים 5 ב-1", "חומר קושר מתכות Metal Out").
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

  // Smart fallback
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
 * Water Diagnosis with Time-Series History, Chemical Additions Ledger, Root Cause & Inventory Matching
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
      const prompt = `אתה מומחה בכיר לכימיית מי ג'קוזי, טיפול בשורש הבעיה ומניעת נזקים מצטברים (Chief Jacuzzi Water Chemist).

עקרון מנחה קריטי:
ההמלצות שלך חייבות להיות מקצועיות, עמוקות ומלאות — לטפל ב**שורש הבעיה** (Root Cause) ולא רק לתת "פלסטרים" קוסמטיים שיוצרים בעיות נוספות (כמו שימוש במסיר קצף סיליקוני שסותם פילטרים בלי לפרק את השומנים והסבונים, או שינוי pH בלי לאזן קודם בסיסיות TA).

נתוני הג'קוזי:
- נפח המים: ${data.volumeLiters} ליטר.
- שיטת חיטוי: ${data.sanitizationType} (כלור / ברום / מלח / חמצן פעיל).
- תאריך מילוי מים אחרון: ${data.lastRefillDate || "לא צוין"}.
- מראה וצלילות המים המדווחת: ${data.waterClarity} (CLEAR / SLIGHTLY_CLOUDY / VERY_CLOUDY / GREEN / FOAMY / BAD_ODOR / METALLIC_COPPER / METALLIC_RUST).
- ערכי בדיקה נוכחיים: 
  * pH: ${phDisplay}
  * כלור חופשי: ${clDisplay}
  * בסיסיות (TA): ${alkDisplay}
- תיאור חופשי מהמשתמש: "${data.description || "ללא תיאור נוסף"}".

=== היסטוריית חומרים ומינונים שהוכנסו לג'קוזי (Chemical Additions Ledger) ===
${JSON.stringify(data.addedChemicalsLedger || [], null, 2)}

- פערי זמנים מבדיקות קודמות:
  * ימים שעברו מבדיקת pH אחרונה: ${data.daysSinceLastPhTest ?? "לא ידוע"}
  * ימים שעברו משטיפת פילטר אחרונה: ${data.daysSinceLastFilterWash ?? "לא ידוע"}
  * ימים שעברו משוק אחרון: ${data.daysSinceLastShock ?? "לא ידוע"}

- מלאי חומרים זמין בארון המשתמש (Inventory):
${JSON.stringify(data.inventory || [], null, 2)}

הנחיות חובה לבניית האבחון:
1. **ניתוח שורש הבעיה (rootCauseAnalysis)**: הסבר למשתמש בשפה בהירה ומקצועית מדוע התופעה הזו נוצרה (למשל: סבונים ושמנים בבגדי ים, מתח פנים חלש מבסיסיות נמוכה, קורוזיה של גוף חימום מ-pH חומצי, או עומס מוצקים מומסים TDS).
2. **תוכנית פעולה משולבת (stepByStepPlan)**:
   - כלול שלב ל**טיפול בשורש הבעיה** (כגון שוק MPS לפירוק שומנים, העלאת בסיסיות לייצוב ה-pH, שטיפת פילטר).
   - אם ממליץ על טיפול נקודתי (כמו מסיר קצף או מצליל), ציין את תופעות הלוואי (סיליקון מצטבר / סתימת פילטר) וחייב שטיפת פילטר בהמשך!
3. **חובת פעולות המשך (followUpRequirements)**: מה חובה לעשות בעוד 12-24 שעות (שטיפת פילטר, בדיקה חוזרת).
4. **הנחיות מניעה (preventionGuidelines)**: איך למנוע מהבעיה לחזור שוב.
5. **התאמה לארון חומרים ורכישה ברשת**: עבור כל שלב בדוק האם קיים בארון (inInventory), ואם חסר ספק מילות חיפוש והמלצת רכישה.

החזר אך ורק תשובת JSON תקנית במבנה:
{
  "waterStatusSummary": "סיכום תמציתי ומדויק של מצב המים",
  "rootCauseAnalysis": "הסבר מקצועי ומפורט על שורש הבעיה האמיתי",
  "severity": "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL",
  "safeToBathe": true | false,
  "needsFullDrain": true | false,
  "estimatedRecoveryTime": "למשל: שעתיים / 24 שעות",
  "followUpRequirements": ["חובה: לשטוף את הפילטר בזרם מים חזק בעוד 24 שעות", "לבצע בדיקת מקלון חוזרת בעוד 12 שעות"],
  "preventionGuidelines": ["הקפד על שטיפת בגדי ים במים בלבד ללא אבקת/מרכך כביסה", "שמור על רמת בסיסיות (TA) בין 80-120 ppm"],
  "recentAdditionsAnalysis": ["התייחסות לחומרים שהוספו לאחרונה והשפעתם"],
  "historicalInsights": ["תובנה על פי ההיסטוריה ופערי הזמנים"],
  "missingTestsAlerts": ["התראה על בדיקה שלא בוצעה זמן רב"],
  "stepByStepPlan": [
    {
      "stepNumber": 1,
      "stepType": "ROOT_CAUSE" | "IMMEDIATE_RELIEF" | "FOLLOW_UP",
      "title": "כותרת הפעולה",
      "chemical": "שם החומר הנדרש",
      "amount": "מינון מדויק ל-${data.volumeLiters} ליטר (למשל: 25 גרם)",
      "instructions": "הוראות יישום מפורטות ובטיחותיות",
      "safetyWarning": "אזהרת בטיחות והשלכות על המים",
      "inInventory": true | false,
      "inventoryItemName": "שם החומר בארון המשתמש",
      "inventoryRemaining": "כמות שנותרה (למשל: 450 גרם)",
      "searchKeywords": "מילות חיפוש מומלצות ברשת אם חסר",
      "buyRecommendation": "המלצה מה לחפש ברשת לרכישה"
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
        const parsed = JSON.parse(jsonMatch[0]) as DiagnosisResponse;
        return enrichInventoryStatus(parsed, data.inventory || []);
      }
    } catch (err) {
      console.error("Gemini API Error, falling back to rule-based calculator:", err);
    }
  }

  return generateRuleBasedDiagnosis(data);
}

function enrichInventoryStatus(
  diagnosis: DiagnosisResponse,
  inventory: Array<{ name: string; category: string; quantity: number; unit: string }>
): DiagnosisResponse {
  const availableInCabinet: Array<{ name: string; neededAmount: string; remaining: string }> = [];
  const missingToBuy: Array<{ name: string; searchKeywords: string; searchUrl: string; whyNeeded: string }> = [];

  for (const step of diagnosis.stepByStepPlan) {
    if (step.chemical.includes("ללא חומר") || step.chemical.includes("תחזוקה רגילה") || step.chemical.includes("שטיפת פילטר")) continue;

    const matched = inventory.find(
      (item) =>
        item.name.toLowerCase().includes(step.chemical.toLowerCase()) ||
        step.chemical.toLowerCase().includes(item.name.toLowerCase()) ||
        (step.inventoryItemName && item.name.toLowerCase().includes(step.inventoryItemName.toLowerCase()))
    );

    if (matched) {
      step.inInventory = true;
      step.inventoryItemName = matched.name;
      step.inventoryRemaining = `${matched.quantity} ${matched.unit === "GRAMS" ? 'גר\'' : matched.unit === "ML" ? 'מ"ל' : matched.unit}`;
      availableInCabinet.push({
        name: matched.name,
        neededAmount: step.amount,
        remaining: step.inventoryRemaining,
      });
    } else {
      step.inInventory = false;
      const keywords = step.searchKeywords || `${step.chemical} לג'קוזי`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keywords)}`;
      step.searchKeywords = keywords;
      step.buyRecommendation = step.buyRecommendation || `חפש ברשת: "${keywords}" באתרי ציוד ספא ובריכות`;
      missingToBuy.push({
        name: step.chemical,
        searchKeywords: keywords,
        searchUrl,
        whyNeeded: step.title,
      });
    }
  }

  diagnosis.inventoryStatus = { availableInCabinet, missingToBuy };
  return diagnosis;
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
  const steps: DiagnosisStep[] = [];
  const historicalInsights: string[] = [];
  const missingTestsAlerts: string[] = [];
  const recentAdditionsAnalysis: string[] = [];
  const issuesFound: string[] = [];
  const followUpRequirements: string[] = [];
  const preventionGuidelines: string[] = [];

  let severity: DiagnosisResponse["severity"] = "GOOD";
  let safeToBathe = true;
  let needsFullDrain = false;
  let estimatedRecoveryTime = "1-2 שעות";
  let rootCauseExplanation = "";

  let stepCount = 1;

  // Inventory Helper
  const inventory = data.inventory || [];
  const findInInventory = (cat: string, namePart: string) => {
    return inventory.find(
      (item) =>
        item.category.toUpperCase() === cat.toUpperCase() ||
        item.name.toLowerCase().includes(namePart.toLowerCase())
    );
  };

  // Analyze added chemicals ledger
  if (data.addedChemicalsLedger && data.addedChemicalsLedger.length > 0) {
    const lastAddition = data.addedChemicalsLedger[0];
    const daysAgo = Math.floor((Date.now() - new Date(lastAddition.date).getTime()) / (1000 * 60 * 60 * 24));
    recentAdditionsAnalysis.push(
      `הוסף לג'קוזי לאחרונה: ${lastAddition.chemical} (${lastAddition.amount || ""}) לפני ${daysAgo === 0 ? "היום" : `${daysAgo} ימים`}.`
    );
  }

  if (data.ph === "UNKNOWN" || data.ph === undefined || data.ph === null) {
    missingTestsAlerts.push("רמת ה-pH לא נבדקה כעת. מומלץ לבצע בדיקת מקלון בהקדם לאימות חומציות המים.");
  }
  if (data.freeChlorine === "UNKNOWN" || data.freeChlorine === undefined || data.freeChlorine === null) {
    missingTestsAlerts.push("רמת חומר החיטוי (כלור/ברום) לא נבדקה כעת.");
  }

  if (data.daysSinceLastFilterWash && data.daysSinceLastFilterWash >= 7) {
    historicalInsights.push(`חלפו ${data.daysSinceLastFilterWash} ימים משטיפת הפילטר האחרונה - מומלץ לשטוף היום בזרם מים.`);
  }
  if (data.daysSinceLastPhTest && data.daysSinceLastPhTest >= 5) {
    historicalInsights.push(`בדיקת ה-pH הקודמת בוצעה לפני ${data.daysSinceLastPhTest} ימים.`);
  }

  // 1. Check Alkalinity (TA) FIRST - Essential Root Cause Buffer
  let alkIsLow = false;
  if (typeof data.alkalinity === "number") {
    if (data.alkalinity < 80) {
      alkIsLow = true;
      severity = severity === "GOOD" ? "ATTENTION" : severity;
      issuesFound.push("הבסיסיות (TA) נמוכה");
      const alkDiff = 100 - data.alkalinity;
      const alkGrams = Math.round((alkDiff / 10) * (data.volumeLiters / 1000) * 18);
      const inStockItem = findInInventory("PH_PLUS", "בסיסיות") || findInInventory("PH_PLUS", "alka");

      steps.push({
        stepNumber: stepCount++,
        stepType: "ROOT_CAUSE",
        title: "טיפול שורש 1: העלאת וייצוב בסיסיות המים (Total Alkalinity)",
        chemical: "מעלה בסיסיות (Alkalinity Increaser / סודיום ביקרבונט)",
        amount: `${alkGrams} גרם`,
        instructions: `הבסיסיות (TA) היא "כרית האוויר" של המים. הוסף כ-${alkGrams} גרם מעלה בסיסיות מומסים בדלי מים עם ג'טים פועלים. זה ימנע תנודות חומציות (pH Bounce) ויחזק את מתח הפנים של המים.`,
        safetyWarning: "איזון הבסיסיות הוא צעד ראשון והכרחי לפני כל ניסיון לכוון את ה-pH.",
        inInventory: !!inStockItem,
        inventoryItemName: inStockItem?.name,
        inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "GRAMS" ? 'גר\'' : inStockItem.unit}` : undefined,
        searchKeywords: "מעלה בסיסיות לג'קוזי Alkalinity Increaser סודיום ביקרבונט",
        buyRecommendation: "חפש ברשת: 'מעלה בסיסיות לג'קוזי' או 'Alka Plus / Alkalinity Increaser'",
      });

      followUpRequirements.push("בדוק מקלון בעוד 12 שעות לוודא שהבסיסיות (TA) עלתה לטווח היעד (80-120 ppm).");
      preventionGuidelines.push("שמור על רמת TA של 80-120 ppm למניעת קצף ותנודות חומציות פתאומיות.");
    } else if (data.alkalinity > 150) {
      issuesFound.push("הבסיסיות (TA) גבוהה");
    }
  }

  // 2. Check pH
  let phIsIdeal = false;
  if (typeof data.ph === "number") {
    if (data.ph >= 7.2 && data.ph <= 7.6) {
      phIsIdeal = true;
    } else {
      const phAdj = calculatePhAdjustment(data.volumeLiters, data.ph);
      if (phAdj) {
        severity = severity === "GOOD" ? "ATTENTION" : severity;
        issuesFound.push(phAdj.action === "REDUCE_PH" ? "רמת ה-pH גבוהה" : "רמת ה-pH נמוכה");
        const isMinus = phAdj.action === "REDUCE_PH";
        const inStockItem = findInInventory(isMinus ? "PH_MINUS" : "PH_PLUS", isMinus ? "minus" : "plus");

        steps.push({
          stepNumber: stepCount++,
          stepType: "ROOT_CAUSE",
          title: isMinus ? "הורדת רמת החומציות (pH)" : "העלאת רמת החומציות (pH)",
          chemical: phAdj.chemical,
          amount: `${phAdj.amountGrams} גרם`,
          instructions: phAdj.instruction,
          safetyWarning: "אין לערבב חומרים יחד בדלי. יש להמיס כל חומר בנפרד במים פושרים.",
          inInventory: !!inStockItem,
          inventoryItemName: inStockItem?.name,
          inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "GRAMS" ? 'גר\'' : inStockItem.unit}` : undefined,
          searchKeywords: isMinus ? "מוריד pH לג'קוזי pH Minus" : "מעלה pH לג'קוזי pH Plus סודה אש",
          buyRecommendation: isMinus
            ? "חפש ברשת: 'מוריד pH לג'קוזי' או 'pH Minus Spa' באתרי ציוד בריכות וספא"
            : "חפש ברשת: 'מעלה pH לג'קוזי' או 'pH Plus Spa' באתרי ציוד בריכות וספא",
        });
      }
    }
  }

  // 3. Check Chlorine / Sanitizer
  let clIsIdeal = false;
  if (typeof data.freeChlorine === "number") {
    if (data.freeChlorine >= 2.0 && data.freeChlorine <= 5.0) {
      clIsIdeal = true;
    } else if (data.freeChlorine < 2.0) {
      const clAdj = calculateChlorineDose(data.volumeLiters, data.freeChlorine);
      if (clAdj) {
        severity = severity === "GOOD" ? "ATTENTION" : severity;
        issuesFound.push("רמת הכלור/חיטוי נמוכה");
        const inStockItem = findInInventory("SANITIZER", "כלור");

        steps.push({
          stepNumber: stepCount++,
          stepType: "ROOT_CAUSE",
          title: "העלאת רמת חומר החיטוי",
          chemical: clAdj.chemical,
          amount: `${clAdj.amountGrams} גרם`,
          instructions: clAdj.instruction,
          safetyWarning: "המתן 20 דקות עם מכסה פתוח וסירקולציה פועלת לפני כניסה למים.",
          inInventory: !!inStockItem,
          inventoryItemName: inStockItem?.name,
          inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "GRAMS" ? 'גר\'' : inStockItem.unit}` : undefined,
          searchKeywords: "כלור גרגירי מהיר לג'קוזי Sodium Dichlor 56%",
          buyRecommendation: "חפש ברשת: 'כלור גרגירי מהיר לג'קוזי' (Sodium Dichlor 56%)",
        });
      }
    } else if (data.freeChlorine > 8.0) {
      severity = "WARNING";
      safeToBathe = false;
      issuesFound.push("רמת הכלור גבוהה מדי");
      steps.push({
        stepNumber: stepCount++,
        stepType: "FOLLOW_UP",
        title: "רמת כלור גבוהה מדי",
        chemical: "אוורור וסירקולציה",
        amount: "ללא חומר",
        instructions: "פתח את המכסה התרמי והפעל את הג'טים למשך 30-45 דקות כדי לתת לכלור להתנדף.",
        safetyWarning: "רחצה בכלור מעל 8 ppm עלולה לגרום לגירוי עור ועיניים.",
        inInventory: true,
      });
    }
  }

  // 4. Foamy Water - Root Cause & Symptom Treatment
  if (data.waterClarity === "FOAMY") {
    severity = severity === "GOOD" ? "ATTENTION" : severity;
    issuesFound.push("הקצפה במים");
    rootCauseExplanation =
      "שורש הבעיה של קצף במים: קצף נוצר משומני גוף, סבונים, קרמים ושאריות חומרי כביסה בבגדי ים, בשילוב עם בסיסיות (TA) נמוכה. מסיר קצף (Anti-Foam) הוא סיליקון שמפוצץ בועות באופן זמני אך נשאר במים ועלול לסתום את הפילטר. כדי לפתור את הבעיה מהשורש יש לחמצן את השומנים בשוק ולשטוף את הפילטר.";

    // Root Cause Step: MPS Oxidation Shock
    const shockGrams = calculateShockDose(data.volumeLiters);
    const inStockShock = findInInventory("SHOCK", "שוק") || findInInventory("SHOCK", "mps");
    steps.push({
      stepNumber: stepCount++,
      stepType: "ROOT_CAUSE",
      title: "טיפול שורש 2: שוק מחמצן (MPS) לפירוק שומנים וסבונים",
      chemical: "אבקת שוק מחמצן ללא כלור (Non-Chlorine Shock / MPS)",
      amount: `${shockGrams} גרם`,
      instructions: `הוסף ${shockGrams} גרם של שוק מחמצן עם מכסה פתוח ומשאבות פועלות. חומר השוק "שורף" ומפרק את התרכובות האורגניות והסבונים שגרמו לקצף, במקום רק לכסות אותם.`,
      safetyWarning: "השאר את המכסה פתוח למשך 30 דקות לאוורור גזים מחומצנים.",
      inInventory: !!inStockShock,
      inventoryItemName: inStockShock?.name,
      inventoryRemaining: inStockShock ? `${inStockShock.quantity} ${inStockShock.unit === "GRAMS" ? 'גר\'' : inStockShock.unit}` : undefined,
      searchKeywords: "שוק ללא כלור לג'קוזי Non Chlorine Shock MPS",
      buyRecommendation: "חפש ברשת: 'שוק ללא כלור לג'קוזי' (MPS / Non-Chlorine Shock)",
    });

    // Immediate Relief Step: Anti-Foam (Minimal dose with warnings)
    const inStockFoam = findInInventory("ANTI_FOAM", "קצף") || findInInventory("ANTI_FOAM", "foam");
    steps.push({
      stepNumber: stepCount++,
      stepType: "IMMEDIATE_RELIEF",
      title: "מענה מיידי (אופציונלי): מסיר קצף נקודתי",
      chemical: "חומר מונע קצף (Anti-Foam / Defoamer)",
      amount: "10-15 מ\"ל",
      instructions: "פזר כמות קטנה בלבד (פקק אחד) ישירות על הקצף לקבלת מים חלקים באותו הרגע.",
      safetyWarning: "זהירות: שימוש עודף במסיר קצף גורם למים שומניים וסותם את הפילטר. אין להוסיף יותר מהמינון המומלץ!",
      inInventory: !!inStockFoam,
      inventoryItemName: inStockFoam?.name,
      inventoryRemaining: inStockFoam ? `${inStockFoam.quantity} ${inStockFoam.unit === "ML" ? 'מ"ל' : inStockFoam.unit}` : undefined,
      searchKeywords: "מסיר קצף לג'קוזי Anti Foam Defoamer Spa",
      buyRecommendation: "חפש ברשת: 'מסיר קצף לג'קוזי' או 'Anti-Foam / Defoamer Spa'",
    });

    // Follow up step: Washing Filter
    steps.push({
      stepNumber: stepCount++,
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
  } else if (data.waterClarity === "METALLIC_COPPER") {
    severity = "WARNING";
    safeToBathe = false;
    estimatedRecoveryTime = "12-24 שעות";
    issuesFound.push("נוכחות נחושת מחומצנת במים");
    rootCauseExplanation =
      "שורש הבעיה: מים חומציים (pH נמוך) ששחקו את גופי החימום הנחושתיים, או מילוי מים עשירים בנחושת. הכלור מחמצן את יוני הנחושת וצובע את המים בטורקיז/ירוק צלול.";

    const inStockItem = findInInventory("OTHER", "מתכות") || findInInventory("OTHER", "metal");
    steps.push({
      stepNumber: stepCount++,
      stepType: "ROOT_CAUSE",
      title: "טיפול שורש 1: קשירת נחושת ומניעת הכתמות (Metal Sequestrant)",
      chemical: "חומר קושר מתכות (Metal Sequestrant / Metal Out)",
      amount: `${Math.round((data.volumeLiters / 1000) * 30)} מ\"ל`,
      instructions: "הוסף חומר קושר מתכות כשהג'טים פועלים למשך 30 דקות. החומר עוטף את יוני הנחושת ומונע הכתמת דפנות אקריל ושיער.",
      safetyWarning: "מים עם נחושת מחומצנת עלולים להכתים שיער בהיר ודפנות אקריל בירוק.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "חומר קושר מתכות לג'קוזי Metal Out Metal Free Stain Scale",
      buyRecommendation: "חפש ברשת: 'חומר קושר מתכות לג'קוזי' או 'Metal Out / Stain & Scale'",
    });

    followUpRequirements.push("שטוף את הפילטר בעוד 24 שעות להרחקת חלקיקי הנחושת שנלכדו.");
    preventionGuidelines.push("שמור תמיד על pH מעל 7.2 כדי למנוע חומציות המאכלת את גופי החימום.");
  } else if (data.waterClarity === "METALLIC_RUST") {
    severity = "WARNING";
    safeToBathe = false;
    estimatedRecoveryTime = "12-24 שעות";
    issuesFound.push("נוכחות ברזל וחלודה במים");
    rootCauseExplanation = "שורש הבעיה: נוכחות יוני ברזל במי המילוי או קורוזיה מתכתית שהתחמצנה במגע עם הכלור.";

    const inStockItem = findInInventory("OTHER", "מתכות") || findInInventory("OTHER", "iron");
    steps.push({
      stepNumber: stepCount++,
      stepType: "ROOT_CAUSE",
      title: "טיפול שורש: מסיר וקושר ברזל וחלודה (Metal Free / Iron Out)",
      chemical: "מסיר וקושר מתכות וברזל (Metal Free / Iron Out)",
      amount: `${Math.round((data.volumeLiters / 1000) * 30)} מ\"ל`,
      instructions: "הוסף מסיר מתכות, הפעל סירקולציה למשך 2-3 שעות ולאחר מכן שטוף את הפילטר.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "מסיר ברזל וחלודה לג'קוזי Iron Out Metal Free",
      buyRecommendation: "חפש ברשת: 'מסיר ברזל לג'קוזי' או 'Metal Free / Iron Out'",
    });

    followUpRequirements.push("שטוף את הפילטר ביסודיות לאחר 6 שעות.");
  } else if (data.waterClarity === "GREEN" || data.waterClarity === "BAD_ODOR") {
    severity = "CRITICAL";
    safeToBathe = false;
    estimatedRecoveryTime = "24-48 שעות";
    issuesFound.push("עכירות ירוקה או ריח חריף");
    rootCauseExplanation =
      "שורש הבעיה: התפתחות אצות, בקטריות או ריכוז גבוה של כלוראמינים (כלור שנקשר לזיעה ושתנן). נדרש שוק מסיבי להשמדת הזיהום.";

    const shockGrams = calculateShockDose(data.volumeLiters) * 1.5;
    const inStockItem = findInInventory("SHOCK", "שוק") || findInInventory("SANITIZER", "כלור");
    steps.push({
      stepNumber: stepCount++,
      stepType: "ROOT_CAUSE",
      title: "טיפול שורש מסיבי: שוק חיטוי מוגבר וחיסול אצות / כלוראמינים",
      chemical: "שוק כלור מהיר (Shock Chlorine)",
      amount: `${Math.round(shockGrams)} גרם`,
      instructions: "הוסף את השוק, הפעל את משאבות הסירקולציה למשך שעה ברציפות ובדוק שוב לאחר 12 שעות.",
      safetyWarning: "חל איסור רחצה עד שרמת הכלור חוזרת ל-3-5 ppm והמים צלולים לחלוטין.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "GRAMS" ? 'גר\'' : inStockItem.unit}` : undefined,
      searchKeywords: "שוק כלור מהיר לג'קוזי Shock Chlorine Granules",
      buyRecommendation: "חפש ברשת: 'שוק כלור מהיר לג'קוזי' או 'Non-Chlorine Shock MPS'",
    });

    followUpRequirements.push("השאר את הג'קוזי פתוח ומאוורר למשך 45 דקות.");
    followUpRequirements.push("בצע בדיקת כלור ו-pH בעוד 12 שעות.");
  } else if (data.waterClarity === "VERY_CLOUDY" || data.waterClarity === "SLIGHTLY_CLOUDY") {
    severity = severity === "GOOD" ? "ATTENTION" : severity;
    issuesFound.push("עכירות מים");
    rootCauseExplanation = "שורש הבעיה: חלקיקי לכלוך זעירים מיקרוניים שקטנים מדי מכדי שהפילטר ילכוד אותם, או עומס אורגני ראשוני.";

    const inStockItem = findInInventory("CLARIFIER", "מצליל") || findInInventory("CLARIFIER", "clarifier");
    steps.push({
      stepNumber: stepCount++,
      stepType: "ROOT_CAUSE",
      title: "הצללת מים ואיחוד חלקיקים (Water Clarifier)",
      chemical: "מצליל מים (Water Clarifier)",
      amount: `${Math.round((data.volumeLiters / 1000) * 15)} מ\"ל`,
      instructions: "הוסף מצליל מים, הפעל ג'טים ל-20 דקות והשאר את הסינון לעבוד. החומר מאחד את החלקיקים הזעירים כדי שהפילטר יסנן אותם.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "מצליל מים לג'קוזי Spa Water Clarifier",
      buyRecommendation: "חפש ברשת: 'מצליל מים לג'קוזי' או 'Spa Water Clarifier'",
    });

    steps.push({
      stepNumber: stepCount++,
      stepType: "FOLLOW_UP",
      title: "פעולת חובה להמשך: שטיפת הפילטר לאחר 6 שעות",
      chemical: "שטיפת פילטר",
      amount: "שטיפה בזרם",
      instructions: "שטוף את הפילטר להרחקת כל הלכלוך שהמצליל ליכד בתוכו.",
      inInventory: true,
    });

    followUpRequirements.push("שטוף את הפילטר בעוד 6-12 שעות ללכידת החלקיקים שהמצליל איחד.");
  }

  // Formulate accurate waterStatusSummary
  let statusSummary = "";
  if (phIsIdeal && clIsIdeal && issuesFound.length === 0) {
    statusSummary = "המים במצב מעולה, מאוזנים וצלולים לחלוטין! ✨";
  } else if (phIsIdeal && clIsIdeal && issuesFound.length > 0) {
    statusSummary = `רמת ה-pH והחיטוי מעולים ומאוזנים! נדרש טיפול נקודתי בנושא: ${issuesFound.join(", ")}.`;
  } else if (issuesFound.length > 0) {
    statusSummary = `נמצאו מדדים הדורשים התייחסות: ${issuesFound.join(", ")}.`;
  } else {
    statusSummary = "המים במצב תקין. המשך בשגרת הבדיקות והתחזוקה.";
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

  const res: DiagnosisResponse = {
    waterStatusSummary: statusSummary,
    rootCauseAnalysis: rootCauseExplanation || "המים נבדקו ונמצאו בפרמטרים תקינים.",
    severity,
    safeToBathe,
    needsFullDrain,
    estimatedRecoveryTime,
    followUpRequirements: followUpRequirements.length > 0 ? followUpRequirements : ["המשך בבדיקת מקלון שבועית רגילה."],
    preventionGuidelines: preventionGuidelines.length > 0 ? preventionGuidelines : [
      "הקפד על מקלחת קלה לפני כניסה למים.",
      "שטוף את מסנן הג'קוזי בזרם מים אחת לשבוע.",
    ],
    recentAdditionsAnalysis,
    historicalInsights,
    missingTestsAlerts,
    stepByStepPlan: steps,
    generalTips: [
      "זכור תמיד לשטוף את הפילטר אחת לשבוע כדי לאפשר סירקולציה וחיטוי יעיל.",
      "מומלץ להיכנס לג'קוזי ללא קרמים או שמנים למניעת קצף.",
      "הקפד על רמת בסיסיות (TA) של 80-120 כדי לשמור על יציבות ה-pH.",
    ],
  };

  return enrichInventoryStatus(res, inventory);
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

export interface ProactiveMaintenanceRequest {
  freeText: string;
  actionDate?: string | Date;
  volumeLiters: number;
  sanitizationType: string;
  lastRefillDate?: string | Date;
  currentTasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    category: string;
    frequencyDays: number;
    nextDueDate: string | Date;
  }>;
}

export interface ProactiveMaintenanceShift {
  taskId: string;
  taskTitle: string;
  currentDueDate: string;
  newDueDate: string;
  shiftDays: number;
  reason: string;
}

export interface ProactiveMaintenanceNewTask {
  title: string;
  description: string;
  hoursAhead: number;
  dueDate: string;
  priority: "MEDIUM" | "HIGH";
}

export interface ProactiveMaintenanceResponse {
  understanding: string;
  chemicalImpact: string;
  updateJacuzziRefill: boolean;
  refillPercentage?: number;
  scheduleShifts: ProactiveMaintenanceShift[];
  newTasksToCreate: ProactiveMaintenanceNewTask[];
  suggestedDiaryTitle: string;
  suggestedDiaryContent: string;
}

export async function analyzeProactiveMaintenance(
  req: ProactiveMaintenanceRequest
): Promise<ProactiveMaintenanceResponse> {
  const actionTime = req.actionDate ? new Date(req.actionDate).getTime() : Date.now();
  const text = req.freeText.toLowerCase();

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `
אתה מומחה מים וטכנאי ג'קוזי בכיר. המשתמש ביצע פעולת אחזקה יזומה בג'קוזי ותיאר אותה במלל חופשי.
עליך לנתח מה בדיוק בוצע, מה ההשפעה על כימיית המים, וכיצד יש להתאים את לוח הזמנים והמשימות הקרובות של הג'קוזי.

נתוני הג'קוזי:
- נפח: ${req.volumeLiters} ליטר
- שיטת חיטוי: ${req.sanitizationType}
- תאריך הפעולה: ${new Date(actionTime).toLocaleDateString("he-IL")}

תיאור הפעולה היזומה של המשתמש:
"${req.freeText}"

משימות מתוזמנות קיימות בלוח השנה:
${JSON.stringify(req.currentTasks, null, 2)}

הנחיות קריטיות להתאמת לוח הזמנים:
1. החלפת מים חלקית או מלאה (Partial / Full Water Change):
   - אם הוחלפו חלק מהמים (למשל 20%-50% או "החלפתי חלק מהמים" / "מילאתי מים חדשים"):
     - המים החדשים צריכים להסתחרר ולהתאזן קודם.
     - אסור להוסיף חיטוי שגרתי (ברום/כלור שבועי) למחרת! אם יש משימת חיטוי/ברום/כלור בימים הקרובים (1-3 ימים), יש לדחות אותה ב-3 עד 4 ימים!
     - יש ליצור משימה חדשה: "בדיקת מקלון ראשונית למים החדשים" בעוד 12-24 שעות.
   - אם הוחלפו כל המים (ריקון ומילוי מלא):
     - יש לדחות את כל המשימות השבועיות הקיימות ב-4 ימים ולהגדיר updateJacuzziRefill: true.
2. שטיפת פילטר / ניקוי מסנן:
   - אם המשתמש ציין ששטף/ניקה את הפילטר: כל משימת "שטיפת פילטר" מתוזמנת קרובה צריכה להידחות ל-7 ימים לאחר מועד הפעולה הנוכחית.
3. שוק / חיטוי חזק (MPS / Shock):
   - אם בוצע שוק: יש לדחות את משימת השוק הבאה ב-7 עד 14 ימים.
4. ניקוי צנרת / שטיפת ג'טים עמוקה:
   - יש לעדכן את משימת הניקוי הרבעונית ב-90 ימים קדימה.

ענה אך ורק במבנה JSON תקין:
{
  "understanding": "הסבר תמציתי ומדויק של מה שהבנת שבוצע (למשל: החלפה חלקית של 30% מהמים וסירקולציה)",
  "chemicalImpact": "הסבר מה ההשפעה הכימית ומדוע יש או אין לשנות משימות (למשל: המים הטריים דיללו את הריכוז, אין להוסיף ברום מחר אלא להמתין לבדיקת בסיס)",
  "updateJacuzziRefill": false,
  "refillPercentage": 30,
  "scheduleShifts": [
    {
      "taskId": "מזהה המשימה הקיימת שנדחית",
      "taskTitle": "שם המשימה",
      "currentDueDate": "תאריך יעד נוכחי ב-ISO",
      "newDueDate": "תאריך יעד חדש ב-ISO",
      "shiftDays": 3,
      "reason": "סיבת הדחייה/השינוי"
    }
  ],
  "newTasksToCreate": [
    {
      "title": "בדיקת מקלון ראשונית למים החדשים",
      "description": "בדיקת pH, בסיסיות וחיטוי לאחר 12 שעות סירקולציה של המים המעורבים",
      "hoursAhead": 16,
      "dueDate": "תאריך מחושב ב-ISO",
      "priority": "HIGH"
    }
  ],
  "suggestedDiaryTitle": "פעולת אחזקה יזומה: החלפת מים חלקית",
  "suggestedDiaryContent": "הוחלפו כ-30% ממי הג'קוזי במים נקיים."
}
`;

      const response = await ai.models.generateContent({
        model: preferredModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const raw = response.text ? response.text.trim() : "";
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (err) {
      console.error("AI Proactive Maintenance analysis error, falling back to rule engine:", err);
    }
  }

  return generateRuleBasedProactiveMaintenance(req);
}

function generateRuleBasedProactiveMaintenance(
  req: ProactiveMaintenanceRequest
): ProactiveMaintenanceResponse {
  const text = req.freeText.toLowerCase();
  const actionTime = req.actionDate ? new Date(req.actionDate).getTime() : Date.now();
  const actionDateObj = new Date(actionTime);

  const scheduleShifts: ProactiveMaintenanceShift[] = [];
  const newTasksToCreate: ProactiveMaintenanceNewTask[] = [];

  let understanding = "פעולת אחזקה יזומה בג'קוזי";
  let chemicalImpact = "הפעולה עודכנה. לוח הזמנים נבדק להתאמות.";
  let updateJacuzziRefill = false;
  let refillPercentage = 0;

  const isWaterChange =
    text.includes("החלפ") ||
    text.includes("החלפת") ||
    text.includes("החלפתי") ||
    text.includes("מים חדשים") ||
    text.includes("מילאתי") ||
    text.includes("מילוי") ||
    text.includes("ריקון") ||
    text.includes("מים");

  const isFilterWash =
    text.includes("פילטר") ||
    text.includes("מסנן") ||
    text.includes("שטפתי") ||
    text.includes("שטיפה") ||
    text.includes("ניקוי פילטר");

  const isShock =
    text.includes("שוק") ||
    text.includes("חיטוי") ||
    text.includes("mps") ||
    text.includes("כלור מרוכז");

  // Analyze water change
  if (isWaterChange) {
    const isFull = text.includes("מלא") || text.includes("הכל") || text.includes("100%") || text.includes("ריקון ומילוי");
    if (isFull) {
      understanding = "ריקון ומילוי מלא של כל מי הג'קוזי (100% מים טריים)";
      chemicalImpact = "המים טריים לחלוטין. יש לאפשר להם להגיע לטמפרטורת יעד ולהסתחרר 24 שעות. כל משימות החיטוי הישנות נדחות עד לבדיקת בסיס ראשונית.";
      updateJacuzziRefill = true;
      refillPercentage = 100;
    } else {
      // Partial change
      refillPercentage = text.includes("חצי") || text.includes("50%") ? 50 : text.includes("שליש") || text.includes("30%") ? 30 : 25;
      understanding = `החלפה חלקית של כ-${refillPercentage}% ממי הג'קוזי (כ-${Math.round((req.volumeLiters * refillPercentage) / 100)} ליטר מים טריים)`;
      chemicalImpact = "הוספת מים טריים דיללה את ריכוז החיטוי ושינתה מעט את ה-pH והבסיסיות. אין להוסיף ברום/כלור שגרתי מחר אלא לאפשר סירקולציה ולבצע בדיקת מקלון ראשונית.";
    }

    // Shift upcoming sanitizer tasks (bromine / chlorine / daily sanitizer)
    for (const task of req.currentTasks) {
      const taskDue = new Date(task.nextDueDate).getTime();
      const daysDiff = (taskDue - actionTime) / (1000 * 3600 * 24);
      const isSanitizer =
        task.title.includes("ברום") ||
        task.title.includes("כלור") ||
        task.title.includes("חיטוי") ||
        task.title.includes("בסיסיות");

      if (isSanitizer && daysDiff >= -0.5 && daysDiff <= 3) {
        const shiftDays = 3;
        const newDue = new Date(taskDue + shiftDays * 24 * 3600 * 1000);
        scheduleShifts.push({
          taskId: task.id,
          taskTitle: task.title,
          currentDueDate: new Date(task.nextDueDate).toISOString(),
          newDueDate: newDue.toISOString(),
          shiftDays,
          reason: "דחייה ב-3 ימים: בעקבות החלפת המים יש לאפשר סירקולציה ולבדוק ערכי בסיס לפני הוספת חיטוי שגרתי.",
        });
      }
    }

    // Add baseline test task
    const baselineDueDate = new Date(actionTime + 16 * 3600 * 1000);
    newTasksToCreate.push({
      title: "בדיקת מקלון ראשונית למים החדשים",
      description: "בדיקת pH, בסיסיות (TA) וחיטוי לאחר סירקולציה של המים שהוחלפו",
      hoursAhead: 16,
      dueDate: baselineDueDate.toISOString(),
      priority: "HIGH",
    });
  }

  // Analyze filter wash
  if (isFilterWash) {
    if (!isWaterChange) {
      understanding = "שטיפת וניקוי פילטר הג'קוזי";
      chemicalImpact = "הפילטר נקי ומאפשר סירקולציה וסינון אופטימליים. מועד שטיפת הפילטר הבא נדחה ב-7 ימים ממועד הפעולה.";
    }

    for (const task of req.currentTasks) {
      if (task.title.includes("פילטר") || task.title.includes("מסנן")) {
        const newDue = new Date(actionTime + 7 * 24 * 3600 * 1000);
        scheduleShifts.push({
          taskId: task.id,
          taskTitle: task.title,
          currentDueDate: new Date(task.nextDueDate).toISOString(),
          newDueDate: newDue.toISOString(),
          shiftDays: 7,
          reason: "הפילטר נשטף היום באופן יזום - המשימה נדחתה ב-7 ימים ממועד השטיפה.",
        });
      }
    }
  }

  // Analyze shock
  if (isShock) {
    for (const task of req.currentTasks) {
      if (task.title.includes("שוק")) {
        const newDue = new Date(actionTime + 7 * 24 * 3600 * 1000);
        scheduleShifts.push({
          taskId: task.id,
          taskTitle: task.title,
          currentDueDate: new Date(task.nextDueDate).toISOString(),
          newDueDate: newDue.toISOString(),
          shiftDays: 7,
          reason: "בוצע טיפול שוק היום - משימת השוק הבאה נדחתה ב-7 ימים.",
        });
      }
    }
  }

  return {
    understanding,
    chemicalImpact,
    updateJacuzziRefill,
    refillPercentage,
    scheduleShifts,
    newTasksToCreate,
    suggestedDiaryTitle: `פעולת אחזקה יזומה: ${understanding}`,
    suggestedDiaryContent: `בוצעה פעולה יזומה: ${req.freeText}. ${chemicalImpact}`,
  };
}

