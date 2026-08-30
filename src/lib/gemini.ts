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
  severity: "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL";
  stepByStepPlan: DiagnosisStep[];
  inventoryStatus?: {
    availableInCabinet: Array<{ name: string; neededAmount: string; remaining: string }>;
    missingToBuy: Array<{ name: string; searchKeywords: string; searchUrl: string; whyNeeded: string }>;
  };
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
 * Water Diagnosis with Time-Series History, Chemical Additions Ledger & Volume Scaling
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
      const prompt = `אתה מומחה בכיר לכימיית מי ג'קוזי, מתכות וספא (Jacuzzi & Metals Water Specialist).
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
להלן רשימת כל החומרים, המינונים והמועדים שבהם המשתמש כבר הוסיף חומרים לג'קוזי שלו:
${JSON.stringify(data.addedChemicalsLedger || [], null, 2)}

- פערי זמנים מבדיקות קודמות:
  * ימים שעברו מבדיקת pH אחרונה: ${data.daysSinceLastPhTest ?? "לא ידוע"}
  * ימים שעברו משטיפת פילטר אחרונה: ${data.daysSinceLastFilterWash ?? "לא ידוע"}
  * ימים שעברו משוק אחרון: ${data.daysSinceLastShock ?? "לא ידוע"}

- מלאי חומרים זמין בארון המשתמש (Inventory):
${JSON.stringify(data.inventory || [], null, 2)}

הנחיות חובה:
1. **התאמה מלאה לארון החומרים וקניות ברשת**:
   - עבור כל שלב בתוכנית (stepByStepPlan), בדוק האם החומר קיים בארון המשתמש (inInventory: true).
   - אם החומר קיים בארון: ציין את שמו המדויק בארון (inventoryItemName) ואת הכמות שנותרה (inventoryRemaining).
   - אם החומר **חסר בארון** (inInventory: false): ספק מילות חיפוש מדויקות לרכישה ברשת (searchKeywords למשל "מעלה בסיסיות לג'קוזי Alka Plus") והמלצת קנייה ברורה (buyRecommendation).
2. **דיוק מוחלט בסיכום המצב**: אם ה-pH מאוזן ותקין, אל תכתוב שנדרש לאזן חומציות! התייחס בדיוק למה שדורש טיפול (למשל: קצף, בסיסיות נמוכה, או עכירות).
3. **מינונים מותאמים אישית**: ספק מינון מדויק בגרם/מ"ל המחושב בדיוק לפי נפח ${data.volumeLiters} ליטר.

החזר אך ורק תשובת JSON תקנית במבנה:
{
  "waterStatusSummary": "סיכום תמציתי ומדויק של מצב המים (מותאם אישית לפרמטרים המדויקים)",
  "severity": "GOOD" | "ATTENTION" | "WARNING" | "CRITICAL",
  "safeToBathe": true | false,
  "needsFullDrain": true | false,
  "estimatedRecoveryTime": "למשל: שעתיים / 24 שעות",
  "recentAdditionsAnalysis": ["התייחסות לחומרים שהוספו לאחרונה והשפעתם"],
  "historicalInsights": ["תובנה על פי ההיסטוריה ופערי הזמנים"],
  "missingTestsAlerts": ["התראה על בדיקה שלא בוצעה זמן רב"],
  "stepByStepPlan": [
    {
      "stepNumber": 1,
      "title": "כותרת הפעולה",
      "chemical": "שם החומר הנדרש",
      "amount": "מינון מדויק ל-${data.volumeLiters} ליטר (למשל: 25 גרם)",
      "instructions": "הוראות יישום מפורטות ובטיחותיות",
      "safetyWarning": "אזהרת בטיחות",
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
        // Enrich inventoryStatus
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
    if (step.chemical.includes("ללא חומר") || step.chemical.includes("תחזוקה רגילה")) continue;

    // Check if matched
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

  let severity: DiagnosisResponse["severity"] = "GOOD";
  let safeToBathe = true;
  let needsFullDrain = false;
  let estimatedRecoveryTime = "1-2 שעות";

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

  // 1. Check pH
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

  // 2. Check Chlorine
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
        title: "רמת כלור גבוהה מדי",
        chemical: "אוורור וסירקולציה",
        amount: "ללא חומר",
        instructions: "פתח את המכסה התרמי והפעל את הג'טים למשך 30-45 דקות כדי לתת לכלור להתנדף.",
        safetyWarning: "רחצה בכלור מעל 8 ppm עלולה לגרום לגירוי עור ועיניים.",
        inInventory: true,
      });
    }
  }

  // 3. Check Alkalinity (TA)
  if (typeof data.alkalinity === "number") {
    if (data.alkalinity < 80) {
      severity = severity === "GOOD" ? "ATTENTION" : severity;
      issuesFound.push("הבסיסיות (TA) נמוכה");
      const alkDiff = 100 - data.alkalinity;
      const alkGrams = Math.round((alkDiff / 10) * (data.volumeLiters / 1000) * 18);
      const inStockItem = findInInventory("PH_PLUS", "בסיסיות") || findInInventory("PH_PLUS", "alka");

      steps.push({
        stepNumber: stepCount++,
        title: "העלאת וייצוב בסיסיות המים (Total Alkalinity)",
        chemical: "מעלה בסיסיות (Alkalinity Increaser / סודיום ביקרבונט)",
        amount: `${alkGrams} גרם`,
        instructions: `הוסף כ-${alkGrams} גרם מעלה בסיסיות כדי לייצב את ה-pH ולמנוע תנודות חומציות ושחיקת מתכות.`,
        inInventory: !!inStockItem,
        inventoryItemName: inStockItem?.name,
        inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "GRAMS" ? 'גר\'' : inStockItem.unit}` : undefined,
        searchKeywords: "מעלה בסיסיות לג'קוזי Alkalinity Increaser סודיום ביקרבונט",
        buyRecommendation: "חפש ברשת: 'מעלה בסיסיות לג'קוזי' או 'Alka Plus / Alkalinity Increaser'",
      });
    } else if (data.alkalinity > 150) {
      issuesFound.push("הבסיסיות (TA) גבוהה");
    }
  }

  // 4. Check Clarity / Appearance Issues
  if (data.waterClarity === "METALLIC_COPPER") {
    severity = "WARNING";
    safeToBathe = false;
    estimatedRecoveryTime = "12-24 שעות";
    issuesFound.push("נוכחות נחושת מחומצנת במים");
    const inStockItem = findInInventory("OTHER", "מתכות") || findInInventory("OTHER", "metal");

    steps.push({
      stepNumber: stepCount++,
      title: "טיפול בנחושת ומתכות מחומצנות (גוון ירוק-טורקיז)",
      chemical: "חומר קושר מתכות (Metal Sequestrant / Metal Out)",
      amount: `${Math.round((data.volumeLiters / 1000) * 30)} מ\"ל`,
      instructions: "הוסף חומר קושר מתכות כשהג'טים פועלים למשך 30 דקות. החומר עוטף את יוני הנחושת ומונע הכתמה ושינוי צבע.",
      safetyWarning: "מים עם נחושת מחומצנת עלולים להכתים שיער בהיר ודפנות אקריל בירוק.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "חומר קושר מתכות לג'קוזי Metal Out Metal Free Stain Scale",
      buyRecommendation: "חפש ברשת: 'חומר קושר מתכות לג'קוזי' או 'Metal Out / Stain & Scale'",
    });
  } else if (data.waterClarity === "METALLIC_RUST") {
    severity = "WARNING";
    safeToBathe = false;
    estimatedRecoveryTime = "12-24 שעות";
    issuesFound.push("נוכחות ברזל וחלודה במים");
    const inStockItem = findInInventory("OTHER", "מתכות") || findInInventory("OTHER", "iron");

    steps.push({
      stepNumber: stepCount++,
      title: "טיפול בחלודה וברזל (גוון צהבהב / חום)",
      chemical: "מסיר וקושר מתכות וברזל (Metal Free / Iron Out)",
      amount: `${Math.round((data.volumeLiters / 1000) * 30)} מ\"ל`,
      instructions: "הוסף מסיר מתכות, הפעל סירקולציה למשך 2-3 שעות ולאחר מכן שטוף את הפילטר.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "מסיר ברזל וחלודה לג'קוזי Iron Out Metal Free",
      buyRecommendation: "חפש ברשת: 'מסיר ברזל לג'קוזי' או 'Metal Free / Iron Out'",
    });
  } else if (data.waterClarity === "GREEN" || data.waterClarity === "BAD_ODOR") {
    severity = "CRITICAL";
    safeToBathe = false;
    estimatedRecoveryTime = "24-48 שעות";
    issuesFound.push("עכירות ירוקה או ריח חריף");
    const shockGrams = calculateShockDose(data.volumeLiters) * 1.5;
    const inStockItem = findInInventory("SHOCK", "שוק") || findInInventory("SANITIZER", "כלור");

    steps.push({
      stepNumber: stepCount++,
      title: "שוק חיטוי מוגבר וחיסול אצות / בקטריות",
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
  } else if (data.waterClarity === "FOAMY") {
    severity = severity === "GOOD" ? "ATTENTION" : severity;
    issuesFound.push("הקצפה במים");
    const inStockItem = findInInventory("ANTI_FOAM", "קצף") || findInInventory("ANTI_FOAM", "foam");

    steps.push({
      stepNumber: stepCount++,
      title: "הסרת קצף ושומנים",
      chemical: "חומר מונע קצף (Anti-Foam / Defoamer)",
      amount: "15-20 מ\"ל",
      instructions: "פזר ישירות על הקצף בזמן שהג'טים פועלים. הקצף ייעלם תוך שניות.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "מסיר קצף לג'קוזי Anti Foam Defoamer Spa",
      buyRecommendation: "חפש ברשת: 'מסיר קצף לג'קוזי' או 'Anti-Foam / Defoamer Spa'",
    });
  } else if (data.waterClarity === "VERY_CLOUDY" || data.waterClarity === "SLIGHTLY_CLOUDY") {
    severity = severity === "GOOD" ? "ATTENTION" : severity;
    issuesFound.push("עכירות מים");
    const inStockItem = findInInventory("CLARIFIER", "מצליל") || findInInventory("CLARIFIER", "clarifier");

    steps.push({
      stepNumber: stepCount++,
      title: "הצללת מים ושטיפת פילטר",
      chemical: "מצליל מים (Water Clarifier)",
      amount: `${Math.round((data.volumeLiters / 1000) * 15)} מ\"ל`,
      instructions: "הוסף מצליל מים, הפעל ג'טים ל-20 דקות והשאר את הסינון לעבוד. לאחר 6 שעות שטוף את הפילטר במים.",
      inInventory: !!inStockItem,
      inventoryItemName: inStockItem?.name,
      inventoryRemaining: inStockItem ? `${inStockItem.quantity} ${inStockItem.unit === "ML" ? 'מ"ל' : inStockItem.unit}` : undefined,
      searchKeywords: "מצליל מים לג'קוזי Spa Water Clarifier",
      buyRecommendation: "חפש ברשת: 'מצליל מים לג'קוזי' או 'Spa Water Clarifier'",
    });
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
      title: "תחזוקה שוטפת ושימור",
      chemical: "תחזוקה רגילה",
      amount: "לפי שגרה",
      instructions: "המים שלך במצב תקין ומאוזנים! המשך בבדיקה שבועית רגילה ושטיפת פילטר.",
      inInventory: true,
    });
  }

  const res: DiagnosisResponse = {
    waterStatusSummary: statusSummary,
    severity,
    safeToBathe,
    needsFullDrain,
    estimatedRecoveryTime,
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
