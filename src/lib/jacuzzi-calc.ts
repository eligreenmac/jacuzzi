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

// Recommended base maintenance tasks when a Jacuzzi is registered
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
  // ~15g of MPS shock or Dichlor per 1000 liters
  return Math.round((volumeLiters / 1000) * 15);
}

export function calculatePhAdjustment(volumeLiters: number, currentPh: number, targetPh = 7.4) {
  const diff = currentPh - targetPh;
  if (Math.abs(diff) < 0.1) return null;

  if (diff > 0) {
    // pH is too high -> need pH Minus (approx 12g per 1000L to drop by 0.2)
    const dosesOfPointTwo = diff / 0.2;
    const grams = Math.round(dosesOfPointTwo * (volumeLiters / 1000) * 12);
    return {
      action: "REDUCE_PH",
      chemical: "pH Minus (מוריד pH / חומצה יבשה)",
      amountGrams: grams,
      instruction: `הוסף כ-${grams} גרם pH Minus כשהג'טים פועלים והמתן 30 דקות לפני בדיקה חוזרת. מומלץ להמיס קודם בדלי מים.`,
    };
  } else {
    // pH is too low -> need pH Plus (approx 10g per 1000L to raise by 0.2)
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

  // Approx 2g of Dichlor per 1000L raises Free Chlorine by ~1.0 ppm
  const grams = Math.round(diff * (volumeLiters / 1000) * 2.2);
  return {
    action: "ADD_CHLORINE",
    chemical: "גרגירי כלור לג'קוזי (Sodium Dichlor)",
    amountGrams: grams,
    instruction: `הוסף ${grams} גרם של גרגירי כלור מומסים בדלי מים עם ג'טים פועלים ומכסה פתוח למשך 20 דקות.`,
  };
}

// Essential chemicals checklist for every Jacuzzi owner
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
