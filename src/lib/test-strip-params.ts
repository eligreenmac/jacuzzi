export interface TestStripParamDef {
  id: string;
  nameHe: string;
  enName: string;
  category: string;
  unit: string;
  idealRange: string;
  isDefault: boolean;
  description: string;
  dangerLow: string;
  dangerHigh: string;
  defaultRanges?: Array<{ id: string; label: string; min?: number; max?: number; isIdeal?: boolean }>;
}

export const PARAM_CATEGORIES = [
  "מדדי איזון מים בסיסיים",
  "מדדי חיטוי וסניטציה",
  "מדדי עומס אורגני (תרכובות חנקן)",
  "מתכות, רעלנים ומינרלים אחרים",
] as const;

export const ALL_TEST_STRIP_PARAMS: TestStripParamDef[] = [
  // 1. מדדי איזון מים בסיסיים
  {
    id: "ph",
    nameHe: "חומציות",
    enName: "pH",
    category: "מדדי איזון מים בסיסיים",
    unit: "pH",
    idealRange: "7.2 - 7.6",
    isDefault: true,
    description: "רמת החומציות או הבסיסיות של המים.",
    dangerLow: "מים חומציים קורוזיביים הגורמים לשחיקת גופי חימום, התנדפות מהירה של חומר החיטוי וצריבה חריפה בעיניים.",
    dangerHigh: "היווצרות אבנית על גופי חימום, מים עכורים, אובדן של עד 80% מיעילות החיטוי וגירוי בעור.",
    defaultRanges: [
      { id: "VERY_LOW", label: "VERY LOW", max: 6.8 },
      { id: "LOW", label: "LOW", min: 6.8, max: 7.1 },
      { id: "OK", label: "OK", min: 7.2, max: 7.6, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 7.7, max: 8.0 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 8.0 },
    ],
  },
  {
    id: "alkalinity",
    nameHe: "בסיסיות כוללת",
    enName: "Total Alkalinity (TA)",
    category: "מדדי איזון מים בסיסיים",
    unit: "ppm",
    idealRange: "80 - 120 ppm",
    isDefault: true,
    description: "\"כרית האוויר\" המייצבת את רמת ה-pH ומונעת תנודות חריפות.",
    dangerLow: "תנודות חריפות ברמת החומציות (pH Bounce), קורוזיה ושחיקה של גופי חימום ורכיבי מתכת, פגיעה במתח הפנים וצריבה בעור ובעיניים.",
    dangerHigh: "קושי וכבדות באיזון ה-pH, נטייה להיווצרות אבנית, עכירות מים והפחתת יעילות חומר החיטוי.",
    defaultRanges: [
      { id: "VERY_LOW", label: "VERY LOW", max: 40 },
      { id: "LOW", label: "LOW", min: 40, max: 79 },
      { id: "OK", label: "OK", min: 80, max: 120, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 121, max: 180 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 180 },
    ],
  },
  {
    id: "calcium",
    nameHe: "קשיות סידן / קשיות כללית",
    enName: "Calcium Hardness / Total Hardness",
    category: "מדדי איזון מים בסיסיים",
    unit: "ppm",
    idealRange: "150 - 250 ppm",
    isDefault: false,
    description: "רמת המינרלים במים (סידן ומגנזיום). מונע קורוזיה או הצטברות אבנית.",
    dangerLow: "מים רעבים המאכלים רכיבי מתכת, אטמי גומי ודפנות אקריל.",
    dangerHigh: "משקעי אבנית קשים על גופי החימום (גורם לשריפת גוף חימום), חסימת מעברי מים ופילטרים.",
    defaultRanges: [
      { id: "LOW", label: "LOW", max: 150 },
      { id: "OK", label: "OK", min: 150, max: 250, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 250, max: 400 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 400 },
    ],
  },
  {
    id: "carbonate",
    nameHe: "קרבונט",
    enName: "Carbonate",
    category: "מדדי איזון מים בסיסיים",
    unit: "ppm",
    idealRange: "0 - 10 ppm",
    isDefault: false,
    description: "אחד המרכיבים הכימיים הבונים את הבסיסיות הכוללת במים.",
    dangerLow: "חוסר בופר קרבונטי מוביל לחוסר יציבות בערכי ה-pH.",
    dangerHigh: "רמת קרבונט גבוהה מעידה על pH בסיסי מדי וגורמת להיווצרות אבנית מהירה ועכירות חלבית.",
    defaultRanges: [
      { id: "OK", label: "OK", max: 10, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 10, max: 25 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 25 },
    ],
  },
  {
    id: "waterTemp",
    nameHe: "טמפרטורת מים",
    enName: "Water Temperature",
    category: "מדדי איזון מים בסיסיים",
    unit: "°C",
    idealRange: "36°C - 39°C",
    isDefault: false,
    description: "בדיקת חום המים לבטיחות המתרחצים ומניעת מכת חום.",
    dangerLow: "מים קרים שאינם מתאימים לרחצה טיפולית ונוחות בספא.",
    dangerHigh: "סכנת מכת חום, התייבשות, ירידת לחץ דם חדה ועומס קיצוני על הלב (מעל 40°C אסור לשימוש).",
  },

  // 2. מדדי חיטוי וסניטציה
  {
    id: "chlorine",
    nameHe: "כלור חופשי",
    enName: "Free Chlorine",
    category: "מדדי חיטוי וסניטציה",
    unit: "ppm",
    idealRange: "2.0 - 4.0 ppm",
    isDefault: true,
    description: "הכלור הפעיל שזמין כרגע לחיטוי המים מחיידקים.",
    dangerLow: "התרבות מהירה של חיידקים ואצות, עכירות מים, ריחות לא נעימים וסכנה בריאותית למתרחצים.",
    dangerHigh: "ריח חריף, גירויים חזקים בעור ובעיניים, פגיעה והלבנה של הכיסוי התרמי ובאטמי הגומי.",
    defaultRanges: [
      { id: "VERY_LOW", label: "VERY LOW", max: 0.5 },
      { id: "LOW", label: "LOW", min: 0.6, max: 1.9 },
      { id: "OK", label: "OK", min: 2.0, max: 4.0, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 4.1, max: 8.0 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 8.0 },
    ],
  },
  {
    id: "totalChlorine",
    nameHe: "כלור כולל",
    enName: "Total Chlorine",
    category: "מדדי חיטוי וסניטציה",
    unit: "ppm",
    idealRange: "שווה לכלור חופשי (עד 0.2 הפרש)",
    isDefault: false,
    description: "סך הכלור במים (הכלור החופשי יחד עם הכלור ה\"קשור\"/המנוצל שסיים את תפקידו).",
    dangerLow: "רמת כלור כללית נמוכה המעידה על חוסר חיטוי.",
    dangerHigh: "נוכחות כלורמינים גבוהה ('כלור קשור'), ריח חריף וצורב, גירוי קשה בעיניים וחוסר חיטוי פעיל (דורש שוק מיידי).",
    defaultRanges: [
      { id: "LOW", label: "LOW", max: 2.0 },
      { id: "OK", label: "OK", min: 2.0, max: 4.0, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 4.0 },
    ],
  },
  {
    id: "bromine",
    nameHe: "ברום",
    enName: "Bromine",
    category: "מדדי חיטוי וסניטציה",
    unit: "ppm",
    idealRange: "3.0 - 5.0 ppm",
    isDefault: false,
    description: "חומר חיטוי חלופי לכלור, עמיד יותר בטמפרטורות גבוהות ולכן נפוץ מאוד בג'קוזי.",
    dangerLow: "חוסר חיטוי, התפתחות חיידקים ובקטריות במים חמים.",
    dangerHigh: "גירוי בעור, ריח כימי חזק ושחיקת חלקי פלסטיק וכיסוי הספא.",
    defaultRanges: [
      { id: "VERY_LOW", label: "VERY LOW", max: 1.0 },
      { id: "LOW", label: "LOW", min: 1.0, max: 2.9 },
      { id: "OK", label: "OK", min: 3.0, max: 5.0, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 5.1, max: 9.0 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 9.0 },
    ],
  },
  {
    id: "cya",
    nameHe: "חומצה ציאנורית / מייצב",
    enName: "Cyanuric Acid / Stabilizer",
    category: "מדדי חיטוי וסניטציה",
    unit: "ppm",
    idealRange: "20 - 50 ppm",
    isDefault: false,
    description: "מגן על הכלור מהתפרקות מהירה בעקבות חשיפה לקרני שמש (UV).",
    dangerLow: "התפרקות מהירה של הכלור מקרני השמש והחום (הג'קוזי נשאר ללא חיטוי).",
    dangerHigh: "נעילת כלור (Chlorine Lock) - הכלור מפסיק לחטא לחלוטין למרות כמות גבוהה במים, מחייב ריקון והחלפת מים.",
    defaultRanges: [
      { id: "LOW", label: "LOW", max: 20 },
      { id: "OK", label: "OK", min: 20, max: 50, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 50, max: 100 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 100 },
    ],
  },
  {
    id: "salt",
    nameHe: "מלח",
    enName: "Salt",
    category: "מדדי חיטוי וסניטציה",
    unit: "ppm",
    idealRange: "1500 - 2500 ppm",
    isDefault: false,
    description: "רמת המלח במים, רלוונטי רק לג'קוזי הפועל עם מערכת כלורינטור (מכשיר המייצר כלור ממלח).",
    dangerLow: "תא המלח לא מייצר כלור והמים נותרים ללא חיטוי.",
    dangerHigh: "קורוזיה מואצת של חלקי מתכת ומשאבות, שחיקה מוקדמת של תא המלח וטעם מלוח במים.",
    defaultRanges: [
      { id: "LOW", label: "LOW", max: 1500 },
      { id: "OK", label: "OK", min: 1500, max: 2500, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 2500, max: 3500 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 3500 },
    ],
  },

  // 3. מדדי עומס אורגני (תרכובות חנקן)
  {
    id: "nitrate",
    nameHe: "ניטראט (חנקה)",
    enName: "Nitrate",
    category: "מדדי עומס אורגני (תרכובות חנקן)",
    unit: "ppm",
    idealRange: "0 - 10 ppm",
    isDefault: false,
    description: "תוצר פירוק של מזהמים אורגניים (זיעה, שמנים). רמה גבוהה פוגעת ביעילות החיטוי.",
    dangerLow: "רמה אפסית - מעולה ותקין לחלוטין.",
    dangerHigh: "מזון להתפתחות אצות, עומס אורגני כבד הפוגע ביעילות החיטוי ועכירות מים עקשנית.",
    defaultRanges: [
      { id: "OK", label: "OK", max: 10, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 10, max: 50 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 50 },
    ],
  },
  {
    id: "nitrite",
    nameHe: "ניטריט",
    enName: "Nitrite",
    category: "מדדי עומס אורגני (תרכובות חנקן)",
    unit: "ppm",
    idealRange: "0 ppm (ללא נוכחות)",
    isDefault: false,
    description: "שלב ביניים בפירוק חנקן במים המעיד על עומס מזהמים.",
    dangerLow: "תקין ונקי לחלוטין (0 ppm).",
    dangerHigh: "עומס ביולוגי חריף של פסולת מתרחצים, צריכת חמצן במים וסכנה בריאותית.",
    defaultRanges: [
      { id: "OK", label: "OK", max: 0.1, isIdeal: true },
      { id: "HIGH", label: "HIGH", min: 0.1, max: 1.0 },
      { id: "VERY_HIGH", label: "VERY HIGH", min: 1.0 },
    ],
  },

  // 4. מתכות, רעלנים ומינרלים אחרים
  {
    id: "iron",
    nameHe: "ברזל",
    enName: "Iron",
    category: "מתכות, רעלנים ומינרלים אחרים",
    unit: "ppm",
    idealRange: "0.0 - 0.2 ppm",
    isDefault: false,
    description: "נוכחותו עלולה לגרום למים חומים ולכתמים על דפנות הג'קוזי.",
    dangerLow: "היעדר ברזל מומס - תקין ונקי.",
    dangerHigh: "צביעת המים בגוון חלודה/חום, יצירת כתמים חומים בלתי הפיכים על גוף האקריל וסתימת פילטרים.",
    defaultRanges: [
      { id: "OK", label: "תקין / נקי (0.0 - 0.2 ppm)", max: 0.2, isIdeal: true },
      { id: "HIGH", label: "נוכחות ברזל (0.3 - 1.0 ppm)", min: 0.3, max: 1.0 },
      { id: "VERY_HIGH", label: "ברזל גבוה (מעל 1.0 ppm)", min: 1.0 },
    ],
  },
  {
    id: "copper",
    nameHe: "נחושת",
    enName: "Copper",
    category: "מתכות, רעלנים ומינרלים אחרים",
    unit: "ppm",
    idealRange: "0.0 - 0.2 ppm",
    isDefault: false,
    description: "עלול לצבוע את המים בירוק ולהעיד על קורוזיה של גוף החימום.",
    dangerLow: "היעדר נחושת מומסת - תקין ונקי.",
    dangerHigh: "צביעת מי הג'קוזי והשיער בגוון ירוק-טורקיז, והעדה על קורוזיה חמורה של גוף החימום.",
    defaultRanges: [
      { id: "OK", label: "תקין / נקי (0.0 - 0.2 ppm)", max: 0.2, isIdeal: true },
      { id: "HIGH", label: "נוכחות נחושת (0.3 - 1.0 ppm)", min: 0.3, max: 1.0 },
      { id: "VERY_HIGH", label: "נחושת גבוהה (מעל 1.0 ppm)", min: 1.0 },
    ],
  },
  {
    id: "chromium",
    nameHe: "כרום",
    enName: "Chromium",
    category: "מתכות, רעלנים ומינרלים אחרים",
    unit: "ppm",
    idealRange: "0.0 ppm",
    isDefault: false,
    description: "מתכת העלולה להגיע מצנרת ישנה או ממי תהום.",
    dangerLow: "תקין ונקי.",
    dangerHigh: "נוכחות מתכת כבדה המעידה על מים מזוהמים מצנרת ישנה, עלולה לגרום לגירוי בעור ולנזק מצטבר.",
    defaultRanges: [
      { id: "OK", label: "תקין / אפס (0.0 ppm)", max: 0.05, isIdeal: true },
      { id: "VERY_HIGH", label: "נוכחות כרום במים", min: 0.05 },
    ],
  },
  {
    id: "lead",
    nameHe: "עופרת",
    enName: "Lead",
    category: "מתכות, רעלנים ומינרלים אחרים",
    unit: "ppm",
    idealRange: "0.0 ppm (אסורה נוכחות)",
    isDefault: false,
    description: "מתכת רעילה, הבדיקה נועדה בעיקר לוודא את איכות מי הברז שאיתם מולא הג'קוזי.",
    dangerLow: "תקין ונקי לחלוטין.",
    dangerHigh: "מתכת רעילה ומסוכנת לבריאות! יש לרוקן את המים מיידית ולבדוק את מקור המילוי.",
    defaultRanges: [
      { id: "OK", label: "תקין / אפס (0.0 ppm)", max: 0.01, isIdeal: true },
      { id: "VERY_HIGH", label: "נוכחות עופרת (מסוכן!)", min: 0.01 },
    ],
  },
  {
    id: "mercury",
    nameHe: "כספית",
    enName: "Mercury",
    category: "מתכות, רעלנים ומינרלים אחרים",
    unit: "ppm",
    idealRange: "0.0 ppm (אסורה נוכחות)",
    isDefault: false,
    description: "מתכת כבדה ורעילה ביותר, נדירה מאוד בבריכות וג'קוזי.",
    dangerLow: "תקין ונקי לחלוטין.",
    dangerHigh: "רעלן מסוכן ביותר! המים אסורים לכל שימוש או מגע.",
    defaultRanges: [
      { id: "OK", label: "תקין / אפס (0.0 ppm)", max: 0.002, isIdeal: true },
      { id: "VERY_HIGH", label: "נוכחות כספית (רעלן מסוכן!)", min: 0.002 },
    ],
  },
  {
    id: "fluoride",
    nameHe: "פלואוריד",
    enName: "Fluoride",
    category: "מתכות, רעלנים ומינרלים אחרים",
    unit: "ppm",
    idealRange: "0.5 - 1.5 ppm",
    isDefault: false,
    description: "מינרל המצוי באופן טבעי במי ברז רבים.",
    dangerLow: "רמה נמוכה (אינה פוגעת באיכות מי הרחצה).",
    dangerHigh: "ריכוז פלואוריד חריג ממי המקור, עלול לגרום לגירויים בריכוזים קיצוניים.",
    defaultRanges: [
      { id: "OK", label: "תקין (0.0 - 1.5 ppm)", max: 1.5, isIdeal: true },
      { id: "HIGH", label: "גבוה (1.6 - 4.0 ppm)", min: 1.6, max: 4.0 },
      { id: "VERY_HIGH", label: "חריג מאוד (מעל 4.0 ppm)", min: 4.0 },
    ],
  },
];

export const DEFAULT_TEST_STRIP_PARAM_IDS = ["ph", "chlorine", "alkalinity"];

export function parseTestStripParams(val: any): string[] {
  if (Array.isArray(val)) return val.filter((id) => id !== "clarity");
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter((id) => id !== "clarity");
    } catch {}
  }
  return DEFAULT_TEST_STRIP_PARAM_IDS;
}

export function getGenericDomain(
  paramId: string,
  val: number | null | undefined,
  rangeStr?: string | null
) {
  if (rangeStr) {
    const s = rangeStr.toUpperCase();
    if (
      s.includes("VERY_LOW") ||
      s.includes("VERY LOW") ||
      s.includes("חומצי מאוד") ||
      s.includes("ללא חיטוי") ||
      s.includes("נמוכה מאוד") ||
      s.includes("נמוך מאוד")
    ) {
      return { id: "VERY_LOW", label: "VERY LOW", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    }
    if (
      s.includes("VERY_HIGH") ||
      s.includes("VERY HIGH") ||
      s.includes("בסיסי מאוד") ||
      s.includes("שוק") ||
      s.includes("עודף") ||
      s.includes("גבוהה מאוד") ||
      s.includes("גבוה מאוד") ||
      s.includes("נעילת כלור") ||
      s.includes("מסוכן") ||
      s.includes("זיהום חמור")
    ) {
      return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    }
    if (s.includes("LOW") || s.includes("נמוך") || s.includes("נמוכה") || s.includes("רכים")) {
      return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    }
    if (s.includes("HIGH") || s.includes("גבוה") || s.includes("גבוהה") || s.includes("קשים") || s.includes("כלורמינים") || s.includes("נוכחות")) {
      return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    }
    if (s.includes("OK") || s.includes("IDEAL") || s.includes("אידיאלי") || s.includes("תקין") || s.includes("תקינה") || s.includes("נקי")) {
      return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    }
  }

  if (val === null || val === undefined || isNaN(val)) {
    return { id: "UNKNOWN", label: "UNKNOWN", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
  }

  if (paramId === "ph") {
    if (val < 6.8) return { id: "VERY_LOW", label: "VERY LOW", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 7.2) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 7.6) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 8.0) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "chlorine") {
    if (val < 0.5) return { id: "VERY_LOW", label: "VERY LOW", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 2.0) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 4.0) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 8.0) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "alkalinity") {
    if (val < 40) return { id: "VERY_LOW", label: "VERY LOW", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 80) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 120) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 180) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "calcium") {
    if (val < 100) return { id: "VERY_LOW", label: "VERY LOW", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 150) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 250) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 400) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "carbonate") {
    if (val <= 10) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 25) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "totalChlorine") {
    if (val <= 4.0) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
  }
  if (paramId === "bromine") {
    if (val < 1.0) return { id: "VERY_LOW", label: "VERY LOW", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
    if (val < 3.0) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 5.0) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 9.0) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "cya") {
    if (val < 20) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 50) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 100) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "salt") {
    if (val < 1500) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 2500) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
  }
  if (paramId === "waterTemp") {
    if (val < 35) return { id: "LOW", label: "LOW", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    if (val <= 39) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "nitrate") {
    if (val <= 10) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 50) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "nitrite") {
    if (val <= 0.1) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 1.0) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "iron" || paramId === "copper") {
    if (val <= 0.2) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 1.0) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "chromium") {
    if (val <= 0.05) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "lead") {
    if (val <= 0.01) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "mercury") {
    if (val <= 0.002) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }
  if (paramId === "fluoride") {
    if (val <= 1.5) return { id: "OK", label: "OK", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    if (val <= 4.0) return { id: "HIGH", label: "HIGH", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    return { id: "VERY_HIGH", label: "VERY HIGH", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" };
  }

  return { id: "UNKNOWN", label: "UNKNOWN", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
}

export function extractParamValue(test: any, paramId: string): { val: number | null; rangeStr: string | null } {
  if (!test) return { val: null, rangeStr: null };
  if (paramId === "ph") return { val: test.ph, rangeStr: test.phRange };
  if (paramId === "chlorine") return { val: test.freeChlorine, rangeStr: test.chlorineRange };
  if (paramId === "alkalinity") return { val: test.alkalinity, rangeStr: test.alkalinityRange };
  if (paramId === "calcium") return { val: test.calcium, rangeStr: test.calciumRange };
  if (paramId === "totalChlorine") return { val: test.totalChlorine, rangeStr: test.totalChlorineRange };
  if (paramId === "cya") return { val: test.cya, rangeStr: test.cyaRange };
  if (paramId === "salt") return { val: test.salt, rangeStr: test.saltRange };
  if (paramId === "waterTemp") return { val: test.waterTemp, rangeStr: test.waterTempRange };
  if (paramId === "carbonate") return { val: test.carbonate, rangeStr: test.carbonateRange };
  if (paramId === "bromine") return { val: test.bromine, rangeStr: test.bromineRange };
  if (paramId === "nitrate") return { val: test.nitrate, rangeStr: test.nitrateRange };
  if (paramId === "nitrite") return { val: test.nitrite, rangeStr: test.nitriteRange };
  if (paramId === "iron") return { val: test.iron, rangeStr: test.ironRange };
  if (paramId === "copper") return { val: test.copper, rangeStr: test.copperRange };
  if (paramId === "chromium") return { val: test.chromium, rangeStr: test.chromiumRange };
  if (paramId === "lead") return { val: test.lead, rangeStr: test.leadRange };
  if (paramId === "mercury") return { val: test.mercury, rangeStr: test.mercuryRange };
  if (paramId === "fluoride") return { val: test.fluoride, rangeStr: test.fluorideRange };

  if (test.extendedMetrics) {
    try {
      const ext = typeof test.extendedMetrics === "string" ? JSON.parse(test.extendedMetrics) : test.extendedMetrics;
      if (ext && ext[paramId]) {
        return {
          val: typeof ext[paramId].val === "number" ? ext[paramId].val : null,
          rangeStr: ext[paramId].range || null,
        };
      }
    } catch {}
  }
  return { val: null, rangeStr: null };
}

