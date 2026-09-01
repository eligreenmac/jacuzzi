export interface JacuzziParameters {
  volumeLiters: number;
  sanitizationType: "CHLORINE" | "BROMINE" | "SALT" | "ACTIVE_OXYGEN" | string;
  usageFrequency?: string;
  lastRefillDate?: Date | string;
}

export interface WaterTestValues {
  ph?: number;
  freeChlorine?: number;
  alkalinity?: number;
  waterClarity?: string;
  description?: string;
}

export interface ChemicalItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

export interface SafetyCheckResult {
  isOverdose: boolean;
  severity: "CRITICAL" | "WARNING" | "NORMAL";
  title: string;
  whatHappened: string;
  immediateActions: string[];
  whatNotToDo: string[];
}

/**
 * Check if a chemical addition is an excessive/abnormal overdose for the tub volume
 */
export function checkChemicalOverdoseSafety(
  chemicalName: string,
  category: string,
  amount: number,
  volumeLiters = 1200
): SafetyCheckResult {
  const normalizedName = (chemicalName || "").toLowerCase();
  const cat = (category || "").toUpperCase();
  const volumeFactor = Math.max(0.5, volumeLiters / 1000);

  // 1. Chlorine / Sanitizer Overdose
  if (cat === "SANITIZER" || normalizedName.includes("כלור") || normalizedName.includes("chlorine")) {
    const maxSafeDose = Math.round(25 * volumeFactor); // e.g. 30g for 1200L
    if (amount > maxSafeDose) {
      return {
        isOverdose: true,
        severity: amount > maxSafeDose * 1.8 ? "CRITICAL" : "WARNING",
        title: "🚨 אזהרת בטיחות: מינון כלור חריג וגבוה!",
        whatHappened: `הוספת כמות של ${amount} גרם כלור לג'קוזי בנפח ${volumeLiters} ליטר (המינון המקסימלי הבטוח לפעם אחת הוא ${maxSafeDose} גרם). רמת הכלור עלולה לזנק מעל 10-15 ppm.`,
        immediateActions: [
          "הסר מיד את המכסה התרמי והשאר את הג'קוזי פתוח לחלוטין.",
          "הפעל את כל משאבות הסירקולציה והג'טים בעוצמה מקסימלית למשך 45-60 דקות כדי לאפשר לכלור להתנדף באוויר.",
          "אם הכמות חריגה מאוד (מעל פי 2 מהמומלץ), שקול לרוקן 30%-50% מהמים ולמלא מים מתוקים ונקיים.",
          "בדוק שוב את רמת הכלור עם מקלון בדיקה בעוד מספר שעות עד שתרד חזרה ל-3-5 ppm.",
        ],
        whatNotToDo: [
          "⛔ חל איסור מוחלט על רחצה במים! מגע עלול לגרום לכוויות כימיות בעור, גירוי קשה בעיניים וצריבה בדרכי הנשימה.",
          "⛔ אין לסגור את המכסה התרמי (אדי הכלור יפגעו במכסה ובכיסוי).",
          "⛔ אין להוסיף חומרים נוספים או חומצות במקביל.",
        ],
      };
    }
  }

  // 2. pH Minus / Acid Overdose
  if (cat === "PH_MINUS" || normalizedName.includes("minus") || normalizedName.includes("חומצה") || normalizedName.includes("מוריד")) {
    const maxSafeDose = Math.round(35 * volumeFactor); // e.g. 42g for 1200L
    if (amount > maxSafeDose) {
      return {
        isOverdose: true,
        severity: "CRITICAL",
        title: "🚨 אזהרת בטיחות: מינון מוריד pH (חומצה) חריג!",
        whatHappened: `הוספת ${amount} גרם של מוריד pH. כמות זו עלולה לרסק את רמת החומציות מתחת ל-6.5 ולגרום למים חומציים וקורוזיביים.`,
        immediateActions: [
          "הפעל סירקולציה ומשאבות ג'טים לערבוב מלא של המים.",
          "המתן שעה ובדוק שוב את רמת ה-pH והבסיסיות (TA) עם מקלון בדיקה.",
          "אם ה-pH צנח מתחת ל-7.0, יש להוסיף בהדרגה pH Plus או תוסף בסיסיות (Alkalinity Increaser) לאיזון.",
        ],
        whatNotToDo: [
          "⛔ חל איסור רחצה במים חומציים! הם גורמים לגירוי וצריבה עזה בעיניים ובעור.",
          "⛔ אל תשאיר את המשאבות כבויות - חומצה מרוכזת ששוקעת עלולה לפגוע בגופי החימום ובאטמי המשאבה.",
        ],
      };
    }
  }

  // 3. Shock Overdose
  if (cat === "SHOCK" || normalizedName.includes("שוק") || normalizedName.includes("shock")) {
    const maxSafeDose = Math.round(45 * volumeFactor);
    if (amount > maxSafeDose) {
      return {
        isOverdose: true,
        severity: "WARNING",
        title: "⚠️ התראה: מינון שוק מחמצן גבוה מהרגיל",
        whatHappened: `הוספת ${amount} גרם שוק (מעל הרף המומלץ של ${maxSafeDose} גרם ל-${volumeLiters} ליטר).`,
        immediateActions: [
          "השאר את המכסה פתוח לחצי שעה עם משאבות פועלות.",
          "המתן 8-12 שעות לפני בדיקה ורחצה.",
        ],
        whatNotToDo: [
          "⛔ אין להתרחץ ב-6 השעות הקרובות.",
          "⛔ אין להוסיף שוק נוסף בימים הקרובים.",
        ],
      };
    }
  }

  // 4. Anti-Foam Overdose
  if (cat === "ANTI_FOAM" || normalizedName.includes("קצף") || normalizedName.includes("foam")) {
    if (amount > 50) {
      return {
        isOverdose: true,
        severity: "WARNING",
        title: "⚠️ התראה: עודף מסיר קצף (Anti-Foam)",
        whatHappened: `הוספת ${amount} מ"ל של מסיר קצף. שימוש בכמות מופרזת עלול לגרום למים להפוך לשומניים ועכורים ולסתום את נקבוביות הפילטר.`,
        immediateActions: [
          "הפעל את הסינון למשך 4 שעות.",
          "שטוף את הפילטר היטב בזרם מים חזק בעוד 24 שעות להסרת עודפי סיליקון.",
        ],
        whatNotToDo: [
          "⛔ אל תוסיף עוד מסיר קצף גם אם הקצף לא נעלם מיד.",
        ],
      };
    }
  }

  return {
    isOverdose: false,
    severity: "NORMAL",
    title: "מינון תקין",
    whatHappened: "הכמות בטווח הבטיחותי התקין לנפח הג'קוזי שלך.",
    immediateActions: [],
    whatNotToDo: [],
  };
}

export function getDefaultMaintenanceTasks(jacuzzi: JacuzziParameters) {
  const now = new Date();
  
  return [
    {
      title: "בדיקת איכות מים וחיטוי שבועית",
      description: "בדיקת מקלון (pH, כלור/ברום ובסיסיות). איזון לפי הצורך והוספת חומר חיטוי שבועי.",
      category: "WEEKLY",
      frequencyDays: 7,
      nextDueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: "HIGH",
    },
    {
      title: "שטיפת פילטר שבועית בזרם מים",
      description: "הוצאת מסנן הג'קוזי ושטיפה יסודית בלחץ מים להסרת לכלוך ושומנים שהצטברו.",
      category: "WEEKLY",
      frequencyDays: 7,
      nextDueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: "MEDIUM",
    },
    {
      title: "שוק חיטוי שבועי (Non-Chlorine Shock / כלור מהיר)",
      description: `הוספת מכת שוק לחימצון תרכובות אורגניות והחזרת צלילות המים (${calculateShockDose(jacuzzi.volumeLiters)} גרם).`,
      category: "WEEKLY",
      frequencyDays: 7,
      nextDueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: "HIGH",
    },
    {
      title: "ניקוי פילטר עמוק בהשריה חודשית",
      description: "השרית הפילטר בדלי עם נוזל ניקוי פילטרים ייעודי למשך 12-24 שעות להמסת שומני גוף ואבנית.",
      category: "MONTHLY",
      frequencyDays: 30,
      nextDueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      priority: "MEDIUM",
    },
    {
      title: "בדיקת אטימות וטיפוח כיסוי תרמי",
      description: "ניקוי וייבוש הכיסוי התרמי ומריחת ספריי הגנה מקרני UV למניעת סדקים וריחות.",
      category: "MONTHLY",
      frequencyDays: 30,
      nextDueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      priority: "LOW",
    },
    {
      title: "ניקוי קו מים ודפנות הג'קוזי",
      description: "ניגוב קו המים והדפנות במטלית מיקרופייבר לחה או ספוגית ייעודית (ללא חומרי ניקוי ביתיים מקציפים) להסרת שומנים וטבעת לכלוך.",
      category: "WEEKLY",
      frequencyDays: 14,
      nextDueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      priority: "MEDIUM",
    },
    {
      title: "שטיפת צנרת (Biofilm Flush), ריקון ומילוי מים חדשים",
      description: "הוספת חומר שטיפת צנרת, הפעלת ג'טים, ריקון מלא, ניקוי דפנות ומילוי מים חדשים ורעננים.",
      category: "QUARTERLY",
      frequencyDays: 90,
      nextDueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      priority: "URGENT",
    },
  ];
}

export function calculateShockDose(volumeLiters: number): number {
  return Math.round((volumeLiters / 1000) * 15);
}

export function calculatePhAdjustment(volumeLiters: number, currentPh: number, targetPh = 7.4) {
  const diff = currentPh - targetPh;
  if (Math.abs(diff) < 0.1) return null;

  if (diff > 0) {
    const dosesOfPointTwo = diff / 0.2;
    const grams = Math.round(dosesOfPointTwo * (volumeLiters / 1000) * 12);
    return {
      action: "REDUCE_PH",
      chemical: "pH Minus (מוריד pH / חומצה יבשה)",
      amountGrams: grams,
      instruction: `הוסף כ-${grams} גרם pH Minus כשהג'טים פועלים והמתן 30 דקות לפני בדיקה חוזרת. מומלץ להמיס קודם בדלי מים.`,
    };
  } else {
    const dosesOfPointTwo = Math.abs(diff) / 0.2;
    const grams = Math.round(dosesOfPointTwo * (volumeLiters / 1000) * 10);
    return {
      action: "INCREASE_PH",
      chemical: "pH Plus (מעלה pH / סודה אש)",
      amountGrams: grams,
      instruction: `הוסף כ-${grams} גרם pH Plus כשהג'טים פועלים והמתן 30 דקות לפני בדיקה חוזרת. מומלץ להמיס קודם בדלי מים.`,
    };
  }
}

export function calculateChlorineDose(volumeLiters: number, currentPpm: number, targetPpm = 3.5) {
  const diff = targetPpm - currentPpm;
  if (diff <= 0) return null;

  const grams = Math.round(diff * (volumeLiters / 1000) * 2.2);
  return {
    action: "ADD_CHLORINE",
    chemical: "גרגירי כלור לג'קוזי (Sodium Dichlor)",
    amountGrams: grams,
    instruction: `הוסף ${grams} גרם של גרגירי כלור מומסים בדלי מים עם ג'טים פועלים ומכסה פתוח למשך 20 דקות.`,
  };
}

export const ESSENTIAL_CHEMICAL_CATEGORIES = [
  {
    category: "SANITIZER",
    nameHe: "חומר חיטוי ראשי (כלור גרגירי לג'קוזי / טבליות ברום)",
    urgency: "קריטי ביותר",
    importance: "השמדת חיידקים, וירוסים ואצות ומניעת זיהומים במים חמים.",
  },
  {
    category: "PH_MINUS",
    nameHe: "מוריד pH (pH Minus / חומצה יבשה)",
    urgency: "קריטי ביותר",
    importance: "במים חמים ה-pH נוטה לעלות. pH גבוה גורם לצריבה, אבנית ומנטרל את יעילות הכלור.",
  },
  {
    category: "PH_PLUS",
    nameHe: "מעלה pH ואיזון בסיסיות (pH Plus / Alkalinity)",
    urgency: "חשוב מאוד",
    importance: "מניעת קורוזיה ושחיקת חלקי מתכת וגופי חימום בג'קוזי כשהחומציות גבוהה מדי.",
  },
  {
    category: "TEST_STRIPS",
    nameHe: "מקלונים לבדיקת איכות המים (5/6 ב-1)",
    urgency: "קריטי ביותר",
    importance: "ללא בדיקה שבועית לא ניתן לדעת אם המים מאוזנים ובטוחים לרחצה.",
  },
  {
    category: "SHOCK",
    nameHe: "אבקת שוק מחמצן (ללא כלור / MPS)",
    urgency: "חשוב מאוד",
    importance: "פירוק שומני גוף, זיעה ותרכובות כלוראמינים (ריח חריף) ללא העמסת עודפי כלור.",
  },
  {
    category: "ANTI_FOAM",
    nameHe: "חומר מונע ומסיר קצף (Defoamer / Anti-Foam)",
    urgency: "מומלץ מאוד",
    importance: "העלמה מיידית של קצף הנוצר מסבונים, שמפו וקרמים של המתרחצים.",
  },
  {
    category: "CLARIFIER",
    nameHe: "מצליל מים (Water Clarifier)",
    urgency: "מומלץ",
    importance: "איחוד חלקיקי לכלוך זעירים כדי שהפילטר יוכל ללכוד אותם לקבלת מים צלולים כקריסטל.",
  },
  {
    category: "CLEANER",
    nameHe: "חומר שטיפת צנרת וניקוי מסננים (Filter & Pipe Flush)",
    urgency: "חשוב לרבעון",
    importance: "פירוק ביופילם שהצטבר בתוך הצינורות הנסתרים לפני ריקון מים תקופתי.",
  },
];
