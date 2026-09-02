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
      { id: "VERY_LOW", label: "חומצי מאוד (מתחת ל-6.8)", max: 6.8 },
      { id: "LOW", label: "חומצי (6.8 - 7.1)", min: 6.8, max: 7.1 },
      { id: "OK", label: "אידיאלי (7.2 - 7.6)", min: 7.2, max: 7.6, isIdeal: true },
      { id: "HIGH", label: "בסיסי (7.7 - 8.0)", min: 7.7, max: 8.0 },
      { id: "VERY_HIGH", label: "בסיסי מאוד (מעל 8.0)", min: 8.0 },
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
      { id: "VERY_LOW", label: "נמוכה מאוד (מתחת ל-40 ppm)", max: 40 },
      { id: "LOW", label: "נמוכה (40 - 79 ppm)", min: 40, max: 79 },
      { id: "OK", label: "אידיאלית (80 - 120 ppm)", min: 80, max: 120, isIdeal: true },
      { id: "HIGH", label: "גבוהה (121 - 180 ppm)", min: 121, max: 180 },
      { id: "VERY_HIGH", label: "גבוהה מאוד (מעל 180 ppm)", min: 180 },
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
      { id: "LOW", label: "רכים / נמוך (מתחת ל-150 ppm)", max: 150 },
      { id: "OK", label: "אידיאלי (150 - 250 ppm)", min: 150, max: 250, isIdeal: true },
      { id: "HIGH", label: "קשים (250 - 400 ppm)", min: 250, max: 400 },
      { id: "VERY_HIGH", label: "קשים מאוד (מעל 400 ppm)", min: 400 },
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
      { id: "OK", label: "תקין / נמוך (0 - 10 ppm)", max: 10, isIdeal: true },
      { id: "HIGH", label: "גבוה (10 - 25 ppm)", min: 10, max: 25 },
      { id: "VERY_HIGH", label: "גבוה מאוד (מעל 25 ppm)", min: 25 },
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
      { id: "VERY_LOW", label: "ללא חיטוי (0.0 - 0.5 ppm)", max: 0.5 },
      { id: "LOW", label: "נמוך (0.6 - 1.9 ppm)", min: 0.6, max: 1.9 },
      { id: "OK", label: "אידיאלי (2.0 - 4.0 ppm)", min: 2.0, max: 4.0, isIdeal: true },
      { id: "HIGH", label: "גבוה (4.1 - 8.0 ppm)", min: 4.1, max: 8.0 },
      { id: "VERY_HIGH", label: "שוק / עודף (מעל 8.0 ppm)", min: 8.0 },
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
      { id: "LOW", label: "נמוך (מתחת ל-2.0 ppm)", max: 2.0 },
      { id: "OK", label: "תקין (תואם כלור חופשי)", min: 2.0, max: 4.0, isIdeal: true },
      { id: "HIGH", label: "גבוה (כלור קשור / שוק נדרש)", min: 4.0 },
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
      { id: "VERY_LOW", label: "ללא חיטוי (מתחת ל-1.0 ppm)", max: 1.0 },
      { id: "LOW", label: "נמוך (1.0 - 2.9 ppm)", min: 1.0, max: 2.9 },
      { id: "OK", label: "אידיאלי (3.0 - 5.0 ppm)", min: 3.0, max: 5.0, isIdeal: true },
      { id: "HIGH", label: "גבוה (5.1 - 9.0 ppm)", min: 5.1, max: 9.0 },
      { id: "VERY_HIGH", label: "גבוה מאוד (מעל 9.0 ppm)", min: 9.0 },
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
      { id: "LOW", label: "נמוך (מתחת ל-20 ppm)", max: 20 },
      { id: "OK", label: "אידיאלי (20 - 50 ppm)", min: 20, max: 50, isIdeal: true },
      { id: "HIGH", label: "גבוה (50 - 100 ppm)", min: 50, max: 100 },
      { id: "VERY_HIGH", label: "נעילת כלור (מעל 100 ppm)", min: 100 },
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
      { id: "LOW", label: "נמוך (מתחת ל-1500 ppm)", max: 1500 },
      { id: "OK", label: "אידיאלי (1500 - 2500 ppm)", min: 1500, max: 2500, isIdeal: true },
      { id: "HIGH", label: "גבוה (2500 - 3500 ppm)", min: 2500, max: 3500 },
      { id: "VERY_HIGH", label: "גבוה מאוד (מעל 3500 ppm)", min: 3500 },
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
      { id: "OK", label: "אידיאלי / נקי (0 - 10 ppm)", max: 10, isIdeal: true },
      { id: "HIGH", label: "בינוני-גבוה (10 - 50 ppm)", min: 10, max: 50 },
      { id: "VERY_HIGH", label: "עומס חריג (מעל 50 ppm)", min: 50 },
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
      { id: "OK", label: "תקין / ללא נוכחות (0 ppm)", max: 0.1, isIdeal: true },
      { id: "HIGH", label: "נוכחות ניטריט (0.1 - 1.0 ppm)", min: 0.1, max: 1.0 },
      { id: "VERY_HIGH", label: "זיהום חמור (מעל 1.0 ppm)", min: 1.0 },
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

export const WATER_CLARITY_PARAM: TestStripParamDef = {
  id: "clarity",
  nameHe: "צלילות ומראה המים",
  enName: "Water Clarity",
  category: "מדדי מראה וצלילות",
  unit: "מראה",
  idealRange: "צלול ונקי",
  isDefault: true,
  description: "מראה המים ועומס חלקיקים/שומנים צפים.",
  dangerLow: "עומס שומנים ולכלוך אורגני, סתימת נקבוביות הפילטר, פגיעה בסירקולציה והתפתחות בקטריאלית.",
  dangerHigh: "עומס שומנים ולכלוך אורגני, סתימת נקבוביות הפילטר, פגיעה בסירקולציה והתפתחות בקטריאלית.",
};

export const ALL_PARAMS_WITH_CLARITY: TestStripParamDef[] = [...ALL_TEST_STRIP_PARAMS, WATER_CLARITY_PARAM];

export const DEFAULT_TEST_STRIP_PARAM_IDS = ["ph", "chlorine", "alkalinity"];

export function parseTestStripParams(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return DEFAULT_TEST_STRIP_PARAM_IDS;
}
