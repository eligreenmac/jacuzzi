import { GoogleGenAI } from "@google/genai";
import {
  calculatePhAdjustment,
  calculateChlorineDose,
  calculateShockDose,
  ESSENTIAL_CHEMICAL_CATEGORIES,
} from "./jacuzzi-calc";

const preferredModel = process.env.GEMINI_MODEL || "gemini-3.7-flash";

function getAiClient() {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key || key === "YOUR_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
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

export interface PendingUnexecutedRecommendation {
  testDate: string | Date;
  stepNumber: number;
  title: string;
  chemical: string;
  amount: string;
  instructions: string;
  reasonUnexecuted: string;
}

export interface DiagnoseRequest {
  volumeLiters: number;
  sanitizationType: string;
  waterClarity: string;
  description?: string;
  ph?: number | "UNKNOWN";
  freeChlorine?: number | "UNKNOWN";
  alkalinity?: number | "UNKNOWN";
  calcium?: number | "UNKNOWN";
  cya?: number | "UNKNOWN";
  tds?: number | "UNKNOWN";
  phosphates?: number | "UNKNOWN";
  waterTemp?: number;
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
  pendingUnexecutedRecommendations?: PendingUnexecutedRecommendation[];
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

  if (!ai) {
    throw new Error(
      "מפתח Google Gemini API אינו מוגדר. יש להוסיף את GEMINI_API_KEY בהגדרות הסביבה (Environment Variables ב-Vercel או בקובץ .env) כדי להפעיל פענוח תמונות AI אמיתי."
    );
  }

  // Extract accurate MIME and clean base64 payload
  let mime = imageMimeType || "image/jpeg";
  let cleanBase64 = imageBase64;
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
  if (mimeMatch) {
    mime = mimeMatch[1];
    cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
  }
  cleanBase64 = cleanBase64.trim();

  const prompt = `אתה מומחה ראייה ממוחשבת (Vision AI) וכימאי מקצועי לבריכות, ספא וג'קוזי.
עליך לפענח ולקרוא במדויק (OCR) את כל הטקסט, התווית והפרטים שעל אריזת המוצר שבתמונה.

דגשים קריטיים לזיהוי מהתווית:
1. קרא את שם המותג והשם המלא והמדויק של המוצר (למשל: "טבליות ברום SpaTime", "מוריד pH גרגירי HTH", "שוק ללא כלור MPS Oxy-Shock", "מסיר קצף Foam Down", "מצליל ספא Clarifier", "מקלונים 4 ב-1 AquaChek").
2. זהה את החומר הפעיל (Active Ingredients) והריכוז כפי שמודפס על האריזה (למשל: סודיום ביסולפט 98%, אשלגן פרוקסימונוסולפט 42%, סודיום דיכלור 56%, ברומו-כלורו-דימתילהידנטואין BCDMH 96%).
3. קבע את הקטגוריה המדויקת:
   - SANITIZER (כלור / ברום / חיטוי)
   - PH_MINUS (מוריד pH)
   - PH_PLUS (מעלה pH / מעלה בסיסיות)
   - SHOCK (שוק מחמצן / שוק מהיר)
   - ANTI_FOAM (מסיר / מונע קצף)
   - CLARIFIER (מצליל מים)
   - TEST_STRIPS (מקלונים / ערכות בדיקה)
   - CLEANER (חומר ניקוי / שטיפת פילטר)
   - OTHER (אחר)
4. קבע את יחידת המידה: GRAMS (אם אבקה/גרגירים/משקל), ML (אם נוזל), TABLETS (אם טבליות), STRIPS (אם מקלונים), PIECES.
5. תמצת בעברית ברורה את אופן השימוש, המינון והוראות הבטיחות שכתובים על האריזה.

החזר אך ורק תשובת JSON תקנית במבנה הבא:
{
  "identified": true,
  "name": "שם המוצר המלא והמותג כפי שזוהה מהתווית",
  "category": "SANITIZER" | "PH_MINUS" | "PH_PLUS" | "SHOCK" | "ANTI_FOAM" | "CLARIFIER" | "TEST_STRIPS" | "CLEANER" | "OTHER",
  "unit": "GRAMS" | "ML" | "TABLETS" | "STRIPS" | "PIECES",
  "defaultMinThreshold": 150,
  "activeIngredients": "החומר הפעיל המדויק מהתווית",
  "usageSummary": "תמצית אופן השימוש והמינון המומלץ מהאריזה בעברית",
  "safetyNotes": "הוראות בטיחות ואחסון מהאריזה"
}`;

  const apiKeyStr = (process.env.GEMINI_API_KEY || "").trim();
  const targetModel = process.env.GEMINI_MODEL || "gemini-3.7-flash";
  const modelsToTry = [
    targetModel,
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ].filter((m, i, arr) => m && arr.indexOf(m) === i) as string[];

  let lastError: any = null;

  // 1. Try via official Google GenAI SDK (Gemini 3.7 / 3.6 / 3.5 / 2.5 Flash)
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          prompt,
          {
            inlineData: {
              mimeType: mime,
              data: cleanBase64,
            },
          },
        ],
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as IdentifyChemicalResponse;
        if (parsed.name && parsed.name.trim() !== "") {
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn(`Gemini SDK model ${model} vision identification attempt failed:`, err?.message || err);
      lastError = err;
    }
  }

  // 2. Direct REST fallback via Google Generative Language API (Gemini 3.7 / 3.6 / 3.5 / 2.5 Flash)
  if (apiKeyStr) {
    for (const model of modelsToTry) {
      try {
        const restRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyStr}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mime,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (restRes.ok) {
          const restJson = await restRes.json();
          const text = restJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as IdentifyChemicalResponse;
            if (parsed.name && parsed.name.trim() !== "") {
              return parsed;
            }
          }
        } else {
          const errData = await restRes.json().catch(() => ({}));
          console.warn(`Direct REST model ${model} error:`, errData);
          lastError = errData?.error?.message || errData?.error || lastError;
        }
      } catch (err: any) {
        console.warn(`Direct REST model ${model} fetch failed:`, err);
        lastError = err;
      }
    }
  }

  throw new Error(
    `שגיאה בזיהוי התמונה במודל Gemini 3.7 Flash (${lastError?.message || JSON.stringify(lastError) || "שגיאת תקשורת"}). ודא שמפתח ה-GEMINI_API_KEY מוגדר ותקין ב-Vercel.`
  );
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
  const calciumDisplay =
    data.calcium === "UNKNOWN" || data.calcium === undefined || data.calcium === null
      ? "לא ידוע / לא נבדק"
      : `${data.calcium} ppm`;
  const cyaDisplay =
    data.cya === "UNKNOWN" || data.cya === undefined || data.cya === null
      ? "לא ידוע / לא נבדק"
      : `${data.cya} ppm`;
  const tdsDisplay =
    data.tds === "UNKNOWN" || data.tds === undefined || data.tds === null
      ? "לא ידוע / לא נבדק"
      : `${data.tds} ppm`;
  const phosphatesDisplay =
    data.phosphates === "UNKNOWN" || data.phosphates === undefined || data.phosphates === null
      ? "לא ידוע / לא נבדק"
      : `${data.phosphates} ppb`;
  const tempDisplay = data.waterTemp ? `${data.waterTemp}°C` : "38°C (סטנדרטי)";

  if (ai) {
    try {
      const prompt = `אתה מומחה בכיר לכימיית מי ג'קוזי, טיפול בשורש הבעיה ומניעת נזקים מצטברים (Chief Jacuzzi Water Chemist).

עקרון מנחה קריטי:
ההמלצות שלך חייבות להיות מקצועיות, עמוקות ומלאות — לטפל ב**שורש הבעיה** (Root Cause) ולא רק לתת "פלסטרים" קוסמטיים שיוצרים בעיות נוספות (כמו שימוש במסיר קצף סיליקוני שסותם פילטרים בלי לפרק את השומנים והסבונים, או שינוי pH בלי לאזן קודם בסיסיות TA).

נתוני הג'קוזי:
- נפח המים: ${data.volumeLiters} ליטר.
- שיטת חיטוי: ${data.sanitizationType} (כלור / ברום / מלח / חמצן פעיל).
- תאריך מילוי מים אחרון: ${data.lastRefillDate || "לא צוין"}.
- טמפרטורת מים: ${tempDisplay}.
- מראה וצלילות המים המדווחת: ${data.waterClarity} (CLEAR / SLIGHTLY_CLOUDY / VERY_CLOUDY / GREEN / FOAMY / BAD_ODOR / METALLIC_COPPER / METALLIC_RUST).
- ערכי בדיקה נוכחיים: 
  * רמת חומציות (pH): ${phDisplay}
  * כלור חופשי / ברום: ${clDisplay}
  * בסיסיות כוללת (TA): ${alkDisplay}
  * קשיות סידן (Calcium Hardness - CH): ${calciumDisplay}
  * חומצה ציאנורית / מייצב (Cyanuric Acid - CYA): ${cyaDisplay}
  * עומס מוצקים מומסים (TDS): ${tdsDisplay}
  * פוספטים (Phosphates): ${phosphatesDisplay}
- תיאור חופשי מהמשתמש: "${data.description || "ללא תיאור נוסף"}".

=== היסטוריית חומרים ומינונים שהוכנסו לג'קוזי (Chemical Additions Ledger) ===
${JSON.stringify(data.addedChemicalsLedger || [], null, 2)}

=== המלצות ומשימות מבדיקות קודמות שטרם סומנו כבוצעו (Pending / Unexecuted Treatments) ===
${JSON.stringify(data.pendingUnexecutedRecommendations || [], null, 2)}

- פערי זמנים מבדיקות קודמות:
  * ימים שעברו מבדיקת pH אחרונה: ${data.daysSinceLastPhTest ?? "לא ידוע"}
  * ימים שעברו משטיפת פילטר אחרונה: ${data.daysSinceLastFilterWash ?? "לא ידוע"}
  * ימים שעברו משוק אחרון: ${data.daysSinceLastShock ?? "לא ידוע"}

- מלאי חומרים זמין בארון המשתמש (Inventory):
${JSON.stringify(data.inventory || [], null, 2)}

הנחיות חובה לבניית האבחון:
1. **התחשבות בפעולות קודמות שלא בוצעו (Pending Actions)**:
   - אם מופיעות המלצות/משימות מבדיקות קודמות שטרם סומנו כבוצעו (למשל: לא היה חומר במלאי או טרם בוצע):
   - אסור בשום אופן להניח שהבעיה נפתרה! עליך להתייחס לכך מפורשות באבחון, בתובנות ההיסטוריות (historicalInsights) ובשורש הבעיה: ציין שהטיפול הקודם עדיין חסר ולכן הבעיה עדיין קיימת, הדגש את החומר שחסר לרכישה, והתאם את ההמלצות החדשות.
2. **ניתוח שורש הבעיה (rootCauseAnalysis)**: הסבר למשתמש בשפה בהירה ומקצועית מדוע התופעה הזו נוצרה (למשל: סבונים ושמנים בבגדי ים, מתח פנים חלש מבסיסיות נמוכה, קורוזיה של גוף חימום מ-pH חומצי, או עומס מוצקים מומסים TDS).
3. **תוכנית פעולה משולבת (stepByStepPlan)**:
   - כלול שלב ל**טיפול בשורש הבעיה** (כגון שוק MPS לפירוק שומנים, העלאת בסיסיות לייצוב ה-pH, שטיפת פילטר).
   - אם ממליץ על טיפול נקודתי (כמו מסיר קצף או מצליל), ציין את תופעות הלוואי (סיליקון מצטבר / סתימת פילטר) וחייב שטיפת פילטר בהמשך!
4. **חובת פעולות המשך (followUpRequirements)**: מה חובה לעשות בעוד 12-24 שעות (שטיפת פילטר, בדיקה חוזרת).
5. **הנחיות מניעה (preventionGuidelines)**: איך למנוע מהבעיה לחזור שוב.
6. **התאמה לארון חומרים ורכישה ברשת**: עבור כל שלב בדוק האם קיים בארון (inInventory), ואם חסר ספק מילות חיפוש והמלצת רכישה.

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

  // Factor in pending / unexecuted previous recommendations
  if (data.pendingUnexecutedRecommendations && data.pendingUnexecutedRecommendations.length > 0) {
    for (const pending of data.pendingUnexecutedRecommendations) {
      historicalInsights.push(
        `⚠️ שים לב: בבדיקה הקודמת (${new Date(pending.testDate).toLocaleDateString("he-IL")}) הומלץ על "${pending.title}" (${pending.amount}), אך הפעולה טרם סומנה כבוצעה (${pending.reasonUnexecuted}). מומלץ להשלים את הטיפול בהקדם.`
      );
    }
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
    const isFull = text.includes("מלא") || text.includes("הכל") || text.includes("100%") || text.includes("רוקנתי ומילאתי") || text.includes("ריקון ומילוי");
    
    // Extract numeric percentage if specified
    const pctMatch = text.match(/(\d+)\s*%/);
    if (isFull) {
      refillPercentage = 100;
    } else if (pctMatch) {
      refillPercentage = Math.min(99, Math.max(5, parseInt(pctMatch[1], 10)));
    } else if (text.includes("חצי") || text.includes("50")) {
      refillPercentage = 50;
    } else if (text.includes("שליש") || text.includes("33") || text.includes("30")) {
      refillPercentage = 30;
    } else if (text.includes("רבע") || text.includes("25")) {
      refillPercentage = 25;
    } else {
      refillPercentage = 30;
    }

    const currentAgeMs = Math.max(0, actionTime - new Date(req.lastRefillDate || actionTime).getTime());
    const currentAgeDays = Math.round(currentAgeMs / (24 * 3600 * 1000));

    if (refillPercentage >= 95) {
      refillPercentage = 100;
      updateJacuzziRefill = true;
      understanding = "ריקון ומילוי מלא של כל מי הג'קוזי (100% מים חדשים)";
      chemicalImpact = "המים טריים לחלוטין וגיל המים אופס ל-0 ימים. ה-AI מאפס את כל משימות הטיפול הישנות ומשבץ מחזור בקרות ראשוני חדש למים החדשים.";

      // Shift/schedule full drain task to 90 days from today
      const nextFullDrainDate = new Date(actionTime + 90 * 24 * 3600 * 1000);
      let foundFullDrainTask = false;
      for (const task of req.currentTasks) {
        if (task.title.includes("ריקון") || task.title.includes("החלפת מים") || task.title.includes("מילוי")) {
          foundFullDrainTask = true;
          scheduleShifts.push({
            taskId: task.id,
            taskTitle: task.title,
            currentDueDate: new Date(task.nextDueDate).toISOString(),
            newDueDate: nextFullDrainDate.toISOString(),
            shiftDays: 90,
            reason: "המים הוחלפו במלואם היום - מועד החלפת המים הבאה נקבע לעוד 90 ימים בדיוק.",
          });
        }
      }

      if (!foundFullDrainTask) {
        newTasksToCreate.push({
          title: "ריקון, ניקוי צנרת ומילוי מים מחדש (100%)",
          description: "ריקון מלא של מי הג'קוזי, שטיפת צנרת ומילוי מים טריים",
          hoursAhead: 90 * 24,
          dueDate: nextFullDrainDate.toISOString(),
          priority: "MEDIUM",
        });
      }

      // Add startup cycle tasks for new water
      const day1Due = new Date(actionTime + 24 * 3600 * 1000);
      const day2Due = new Date(actionTime + 48 * 3600 * 1000);
      newTasksToCreate.push({
        title: "בדיקת מקלון ראשונית ואיזון מים טריים (TA & pH)",
        description: "בדיקת מקלון מקיפה למים החדשים לאחר 24 שעות חימום וסירקולציה. יש לאזן קודם בסיסיות (TA) ל-80-120 ואז pH ל-7.2-7.6.",
        hoursAhead: 24,
        dueDate: day1Due.toISOString(),
        priority: "HIGH",
      });

      newTasksToCreate.push({
        title: "בדיקת חיטוי מייצבת ראשונה",
        description: "בדיקת רמת החיטוי (כלור / ברום) לאחר האיזון הראשוני של המים החדשים.",
        hoursAhead: 48,
        dueDate: day2Due.toISOString(),
        priority: "HIGH",
      });
    } else {
      // Partial change
      const newEffectiveAgeDays = Math.round(currentAgeDays * (1 - refillPercentage / 100));
      const daysGained = Math.max(0, currentAgeDays - newEffectiveAgeDays);
      const nextFullDrainDays = Math.max(7, 90 - newEffectiveAgeDays);
      const nextFullDrainDate = new Date(actionTime + nextFullDrainDays * 24 * 3600 * 1000);

      understanding = `החלפה חלקית של ${refillPercentage}% ממי הג'קוזי (כ-${Math.round((req.volumeLiters * refillPercentage) / 100)} ליטר מים טריים)`;
      chemicalImpact = `החלפת ${refillPercentage}% מהמים דיללה את עומס ה-TDS ושקללה את גיל המים מ-${currentAgeDays} ימים ל-${newEffectiveAgeDays} ימים (הרווחת עוד ${daysGained} ימי חיים למים!). מועד הריקון המלא הבא בלוח השנה נדחה ונקבע לעוד ${nextFullDrainDays} ימים (${nextFullDrainDate.toLocaleDateString("he-IL")}).`;

      // Shift the 100% full replacement task further into the future!
      let foundFullDrainTask = false;
      for (const task of req.currentTasks) {
        if (task.title.includes("ריקון") || task.title.includes("החלפת מים") || task.title.includes("מילוי")) {
          foundFullDrainTask = true;
          scheduleShifts.push({
            taskId: task.id,
            taskTitle: task.title,
            currentDueDate: new Date(task.nextDueDate).toISOString(),
            newDueDate: nextFullDrainDate.toISOString(),
            shiftDays: daysGained,
            reason: `החלפת ${refillPercentage}% מים האריכה את חיי המים בעוד ${daysGained} ימים. מועד ההחלפה המלאה נדחה לעוד ${nextFullDrainDays} ימים.`,
          });
        }
      }

      if (!foundFullDrainTask) {
        newTasksToCreate.push({
          title: "ריקון, ניקוי צנרת ומילוי מים מחדש (100%)",
          description: "ריקון מלא של מי הג'קוזי, שטיפת צנרת ומילוי מים טריים",
          hoursAhead: nextFullDrainDays * 24,
          dueDate: nextFullDrainDate.toISOString(),
          priority: "MEDIUM",
        });
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

export interface OptimizeRoutineRequest {
  volumeLiters: number;
  sanitizationType: string;
  location: string;
  usageFrequency: string;
  lastRefillDate: string | Date;
  waterAgeDays: number;
  currentTasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    category: string;
    frequencyDays: number;
    nextDueDate: string | Date;
    isCompleted: boolean;
    lastDoneDate?: string | Date | null;
  }>;
  recentWaterLogs: Array<{
    testedAt: string | Date;
    ph?: number | null;
    freeChlorine?: number | null;
    alkalinity?: number | null;
    waterClarity: string;
    aiDiagnosis?: string | null;
  }>;
  recentDiary: Array<{
    entryDate: string | Date;
    title: string;
    chemicalsAdded?: string | null;
    content: string;
  }>;
  inventory: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }>;
}

export interface TaskToDelete {
  taskId: string;
  taskTitle: string;
  reason: string;
}

export interface TaskToUpdate {
  taskId: string;
  taskTitle: string;
  currentFrequencyDays: number;
  newFrequencyDays: number;
  currentDueDate: string;
  newDueDate: string;
  reason: string;
}

export interface TaskToCreate {
  title: string;
  description: string;
  category: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM";
  frequencyDays: number;
  nextDueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  reason: string;
}

export interface OptimizeRoutineResponse {
  routineHealthScore: number; // 0 - 100
  executiveSummary: string;
  waterAgeAnalysis: string;
  tasksToDelete: TaskToDelete[];
  tasksToUpdate: TaskToUpdate[];
  tasksToCreate: TaskToCreate[];
  proTips: string[];
}

export async function optimizeRoutineWithGemini(
  req: OptimizeRoutineRequest
): Promise<OptimizeRoutineResponse> {
  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `אתה מומחה-על לניהול שגרת תחזוקה ואופטימיזציית משימות לג'קוזי (Spa Master Maintenance AI).
עליך לסרוק את כל היסטוריית הבדיקות, גיל המים המשוקלל, פעולות שבוצעו, המלאי הקיים וכל המשימות הפעילות בלוח השנה.
מטרתך: לבצע סדר מוחלט וסנכרון מלא של שגרת הטיפולים — למחוק משימות כפולות/מיותרות/שלא רלוונטיות, לעדכן תאריכים ותדירויות לפי מצב המים האמיתי, ולהוסיף משימות שחסרות לשמירה על מים מושלמים.

נתוני הג'קוזי:
- נפח: ${req.volumeLiters} ליטר
- שיטת חיטוי: ${req.sanitizationType} (CHLORINE / BROMINE / SALT / ACTIVE_OXYGEN)
- מיקום: ${req.location}
- תדירות שימוש: ${req.usageFrequency}
- גיל מים משוקלל: ${req.waterAgeDays} ימים (תאריך מילוי אחרון: ${new Date(req.lastRefillDate).toLocaleDateString("he-IL")})

משימות קיימות בלוח השנה:
${JSON.stringify(req.currentTasks, null, 2)}

מדידות ובדיקות מים אחרונות:
${JSON.stringify(req.recentWaterLogs, null, 2)}

פעולות שתועדו לאחרונה ביומן:
${JSON.stringify(req.recentDiary, null, 2)}

מלאי חומרים בארון:
${JSON.stringify(req.inventory, null, 2)}

עקרונות אופטימיזציה מקצועיים:
1. **מחיקת משימות לא רלוונטיות / כפולות (tasksToDelete)**:
   - משימה שלא תואמת את שיטת החיטוי (למשל משימת כלור כשהג'קוזי עובד על ברום או להפך).
   - משימות כפולות לאותו עניין.
   - משימות שנוצרו בעבר באופן חד-פעמי וכבר אינן רלוונטיות.
2. **עדכון משימות קיימות (tasksToUpdate)**:
   - אם משימת שטיפת פילטר או שוק פגת תוקף מזמן או שבוצעה לאחרונה ביומן, עדכן את התאריך הבא והתדירות.
   - התאמת תדירויות לפי תדירות השימוש (למשל שימוש כבד דורש שטיפת פילטר כל 5 ימים במקום 7).
3. **הוספת משימות חיוניות שחסרות (tasksToCreate)**:
   - בדיקת מקלון שבועית (אם לא קיימת).
   - שטיפת פילטר שבועית.
   - ניקוי והשריית פילטר חודשית בחומר מסיר שומנים.
   - ריקון ומילוי מים רבעוני (בהתאם לגיל המים).
   - שוק מחמצן תקופתי.

החזר אך ורק תשובת JSON תקנית במבנה:
{
  "routineHealthScore": 85,
  "executiveSummary": "ניתוח תמציתי של יעילות השגרה הנוכחית וההתאמות שבוצעו",
  "waterAgeAnalysis": "ניתוח גיל המים הנוכחי (${req.waterAgeDays} ימים) והמלצה למילוי/החלפה חלקית בעתיד",
  "tasksToDelete": [
    {
      "taskId": "מזהה המשימה למחיקה",
      "taskTitle": "שם המשימה",
      "reason": "הסבר מדוע משימה זו מיותרת/לא רלוונטית"
    }
  ],
  "tasksToUpdate": [
    {
      "taskId": "מזהה המשימה לעדכון",
      "taskTitle": "שם המשימה",
      "currentFrequencyDays": 7,
      "newFrequencyDays": 7,
      "currentDueDate": "ISO",
      "newDueDate": "ISO",
      "reason": "הסבר מדוע עודכן התאריך/התדירות"
    }
  ],
  "tasksToCreate": [
    {
      "title": "שם המשימה החדשה להוספה",
      "description": "הסבר על המשימה",
      "category": "WEEKLY" | "MONTHLY" | "QUARTERLY",
      "frequencyDays": 7,
      "nextDueDate": "ISO",
      "priority": "HIGH" | "MEDIUM",
      "reason": "מדוע משימה זו חיונית לשגרה"
    }
  ],
  "proTips": ["טיפ מקצועי 1", "טיפ מקצועי 2"]
}`;

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
        return JSON.parse(raw) as OptimizeRoutineResponse;
      }
    } catch (err) {
      console.error("AI Routine Optimization error, falling back to rule engine:", err);
    }
  }

  return generateRuleBasedRoutineOptimization(req);
}

function generateRuleBasedRoutineOptimization(
  req: OptimizeRoutineRequest
): OptimizeRoutineResponse {
  const tasksToDelete: TaskToDelete[] = [];
  const tasksToUpdate: TaskToUpdate[] = [];
  const tasksToCreate: TaskToCreate[] = [];

  const now = Date.now();
  const todayIso = new Date(now).toISOString();

  // 1. Check Sanitizer Compatibility
  const isBromine = req.sanitizationType === "BROMINE";
  const isChlorine = req.sanitizationType === "CHLORINE";

  for (const task of req.currentTasks) {
    // Delete chlorine task if jacuzzi is bromine
    if (isBromine && task.title.includes("כלור") && !task.title.includes("ברום")) {
      tasksToDelete.push({
        taskId: task.id,
        taskTitle: task.title,
        reason: "שיטת החיטוי המוגדרת בג'קוזי היא ברום - משימת כלור אינה רלוונטית.",
      });
    } else if (isChlorine && task.title.includes("ברום") && !task.title.includes("כלור")) {
      tasksToDelete.push({
        taskId: task.id,
        taskTitle: task.title,
        reason: "שיטת החיטוי המוגדרת בג'קוזי היא כלור - משימת ברום אינה רלוונטית.",
      });
    }

    // Check overdue outdated tasks (> 30 days overdue)
    const dueTime = new Date(task.nextDueDate).getTime();
    if (!task.isCompleted && now - dueTime > 30 * 24 * 3600 * 1000) {
      const newDue = new Date(now + 2 * 24 * 3600 * 1000).toISOString();
      tasksToUpdate.push({
        taskId: task.id,
        taskTitle: task.title,
        currentFrequencyDays: task.frequencyDays,
        newFrequencyDays: task.frequencyDays,
        currentDueDate: new Date(task.nextDueDate).toISOString(),
        newDueDate: newDue,
        reason: "המשימה פגת תוקף מעל 30 ימים - תאריך היעד רוענן ליומיים הקרובים.",
      });
    }
  }

  // 2. Check Missing Essential Tasks
  const hasFilterWash = req.currentTasks.some((t) => t.title.includes("פילטר") || t.title.includes("מסנן"));
  const hasWaterTest = req.currentTasks.some((t) => t.title.includes("בדיק") || t.title.includes("מקלון") || t.title.includes("איכות"));
  const hasDrainRefill = req.currentTasks.some((t) => t.title.includes("החלפת מים") || t.title.includes("ריקון"));
  const hasShock = req.currentTasks.some((t) => t.title.includes("שוק") || t.title.includes("חיטוי"));

  if (!hasFilterWash) {
    tasksToCreate.push({
      title: "שטיפת פילטר שבועית במים",
      description: "שטיפת מסנן הג'קוזי בזרם מים חזק להסרת שומנים, לכלוך ושאריות כימיקלים.",
      category: "WEEKLY",
      frequencyDays: 7,
      nextDueDate: new Date(now + 4 * 24 * 3600 * 1000).toISOString(),
      priority: "HIGH",
      reason: "משימת שטיפת פילטר חיונית לשמירה על סירקולציה ומים צלולים ואינה מוגדרת בלוח השנה.",
    });
  }

  if (!hasWaterTest) {
    tasksToCreate.push({
      title: "בדיקת איכות מים שבועית (מקלון)",
      description: "בדיקת pH, רמת חיטוי ובסיסיות TA באמצעות מקלון בדיקה.",
      category: "WEEKLY",
      frequencyDays: 7,
      nextDueDate: new Date(now + 2 * 24 * 3600 * 1000).toISOString(),
      priority: "HIGH",
      reason: "בדיקת מים שבועית היא עמוד השדרה של בריאות הג'קוזי.",
    });
  }

  if (!hasDrainRefill) {
    const daysUntilQuarterly = Math.max(7, 90 - req.waterAgeDays);
    tasksToCreate.push({
      title: "ריקון, ניקוי צנרת ומילוי מים מחדש",
      description: "ריקון מלא של מי הג'קוזי, שטיפת צנרת עם חומר ייעודי ומילוי מים טריים.",
      category: "QUARTERLY",
      frequencyDays: 90,
      nextDueDate: new Date(now + daysUntilQuarterly * 24 * 3600 * 1000).toISOString(),
      priority: "MEDIUM",
      reason: `גיל המים הנוכחי הוא ${req.waterAgeDays} ימים. מומלץ לחדש מים כל 90 ימים למניעת עומס מוצקים מומסים (TDS).`,
    });
  }

  if (!hasShock) {
    tasksToCreate.push({
      title: "שוק מחמצן תקופתי (MPS)",
      description: "הוספת שוק מחמצן ללא כלור לפירוק תרכובות אורגניות, שמנים וכלוראמינים.",
      category: "WEEKLY",
      frequencyDays: 7,
      nextDueDate: new Date(now + 5 * 24 * 3600 * 1000).toISOString(),
      priority: "MEDIUM",
      reason: "שוק שבועי שומר על מתח הפנים ומונע ריחות חריפים והקצפה.",
    });
  }

  const score = Math.max(50, 100 - tasksToDelete.length * 15 - (tasksToCreate.length > 0 ? 20 : 0));

  return {
    routineHealthScore: score,
    executiveSummary: `נסרקו ${req.currentTasks.length} משימות קיימות. זוהו ${tasksToDelete.length} משימות לא רלוונטיות למחיקה, ${tasksToUpdate.length} משימות לרענון תאריך, ו-${tasksToCreate.length} משימות יסוד חיוניות שמומלץ להוסיף.`,
    waterAgeAnalysis: `גיל המים המשוקלל הוא ${req.waterAgeDays} ימים. מועד ריקון ומילוי מים מומלץ בעוד כ-${Math.max(1, 90 - req.waterAgeDays)} ימים.`,
    tasksToDelete,
    tasksToUpdate,
    tasksToCreate,
    proTips: [
      "שטיפת פילטר קבועה חוסכת עד 40% בצריכת הכימיקלים.",
      "הקפד על רמת בסיסיות (TA) של 80-120 לפני איזון ה-pH.",
      "אם החלפת חלק מהמים, גיל המים משתקלל אוטומטית ומאריך את הזמן עד להחלפה המלאה הבאה.",
    ],
  };
}


