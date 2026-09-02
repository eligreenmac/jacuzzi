export interface TestStripParamDef {
  id: string;
  nameHe: string;
  enName: string;
  unit: string;
  idealRange: string;
  isDefault: boolean;
  description: string;
  dangerLow: string;
  dangerHigh: string;
}

export const ALL_TEST_STRIP_PARAMS: TestStripParamDef[] = [
  {
    id: "ph",
    nameHe: "חומציות",
    enName: "pH",
    unit: "pH",
    idealRange: "7.2 - 7.6",
    isDefault: true,
    description: "איזון החומציות והבסיסיות במים, קריטי ליעילות החיטוי ושמירה על גופי החימום",
    dangerLow: "מים חומציים קורוזיביים הגורמים לשחיקת גופי חימום, התנדפות מהירה של חומר החיטוי וצריבה חריפה בעיניים.",
    dangerHigh: "היווצרות אבנית על גופי חימום, מים עכורים, אובדן של עד 80% מיעילות החיטוי וגירוי בעור.",
  },
  {
    id: "chlorine",
    nameHe: "חומר חיטוי",
    enName: "כלור חופשי / ברום (Free Chlorine / Bromine)",
    unit: "ppm",
    idealRange: "2.0 - 4.0 ppm",
    isDefault: true,
    description: "חיסול בקטריות, וירוסים, פטריות ואצות במים",
    dangerLow: "התרבות מהירה של חיידקים ואצות, עכירות מים, ריחות לא נעימים וסכנה בריאותית למתרחצים.",
    dangerHigh: "ריח חריף, גירויים חזקים בעור ובעיניים, פגיעה והלבנה של הכיסוי התרמי ובאטמי הגומי.",
  },
  {
    id: "alkalinity",
    nameHe: "בסיסיות כוללת",
    enName: "Total Alkalinity (TA)",
    unit: "ppm",
    idealRange: "80 - 120 ppm",
    isDefault: true,
    description: "כרית האוויר והבופר שמייצב את ה-pH ומונע תנודות חריפות",
    dangerLow: "תנודות חריפות ברמת החומציות (pH Bounce), קורוזיה ושחיקה של גופי חימום ורכיבי מתכת, פגיעה במתח הפנים וצריבה בעור ובעיניים.",
    dangerHigh: "קושי וכבדות באיזון ה-pH, נטייה להיווצרות אבנית, עכירות מים והפחתת יעילות חומר החיטוי.",
  },
  {
    id: "clarity",
    nameHe: "צלילות מים",
    enName: "Water Clarity",
    unit: "מראה",
    idealRange: "צלול ונקי",
    isDefault: true,
    description: "מראה המים ועומס חלקיקים/שומנים צפים",
    dangerLow: "עומס שומנים ולכלוך אורגני, סתימת נקבוביות הפילטר, פגיעה בסירקולציה והתפתחות בקטריאלית.",
    dangerHigh: "עומס שומנים ולכלוך אורגני, סתימת נקבוביות הפילטר, פגיעה בסירקולציה והתפתחות בקטריאלית.",
  },
  {
    id: "calcium",
    nameHe: "קשיות סידן",
    enName: "Calcium Hardness (CH)",
    unit: "ppm",
    idealRange: "150 - 250 ppm",
    isDefault: false,
    description: "רמת המינרלים והסידן במים להגנה על גופי חימום ומשאבות",
    dangerLow: "מים רעבים המאכלים רכיבי מתכת, אטמי גומי ודפנות אקריל.",
    dangerHigh: "משקעי אבנית קשים על גופי החימום (גורם לשריפת גוף חימום), חסימת מעברי מים ופילטרים.",
  },
  {
    id: "totalChlorine",
    nameHe: "כלור כולל",
    enName: "Total Chlorine (TC)",
    unit: "ppm",
    idealRange: "שווה לכלור חופשי (עד 0.2 הפרש)",
    isDefault: false,
    description: "מדידת כלור פעיל יחד עם כלורמינים קשורים (פסולת חיטוי)",
    dangerLow: "רמת כלור כללית נמוכה המעידה על חוסר חיטוי.",
    dangerHigh: "נוכחות כלורמינים גבוהה ('כלור קשור'), ריח חריף וצורב, גירוי קשה בעיניים וחוסר חיטוי פעיל (דורש שוק מיידי).",
  },
  {
    id: "cya",
    nameHe: "מייצב / חומצה ציאנורית",
    enName: "Cyanuric Acid (CYA / Stabilizer)",
    unit: "ppm",
    idealRange: "20 - 50 ppm",
    isDefault: false,
    description: "מגן על הכלור מפני התפרקות מקרינת שמש (UV בג'קוזי חיצוני)",
    dangerLow: "התפרקות מהירה של הכלור מקרני השמש והחום (הג'קוזי נשאר ללא חיטוי).",
    dangerHigh: "נעילת כלור (Chlorine Lock) - הכלור מפסיק לחטא לחלוטין למרות כמות גבוהה במים, מחייב ריקון והחלפת מים.",
  },
  {
    id: "salt",
    nameHe: "רמת מלח",
    enName: "Salt (למערכות מלח)",
    unit: "ppm",
    idealRange: "1500 - 2500 ppm",
    isDefault: false,
    description: "רמת המלח הנדרשת לפעולת תא הכלורינטור",
    dangerLow: "תא המלח לא מייצר כלור והמים נותרים ללא חיטוי.",
    dangerHigh: "קורוזיה מואצת של חלקי מתכת ומשאבות, שחיקה מוקדמת של תא המלח וטעם מלוח במים.",
  },
  {
    id: "waterTemp",
    nameHe: "טמפרטורת מים",
    enName: "Water Temperature",
    unit: "°C",
    idealRange: "36°C - 39°C",
    isDefault: false,
    description: "בדיקת חום המים לבטיחות המתרחצים ומניעת מכת חום",
    dangerLow: "מים קרים שאינם מתאימים לחוויית ספא.",
    dangerHigh: "סכנת מכת חום, התייבשות, ירידת לחץ דם חדה, ועומס קיצוני על מערכת הלב (מעל 40°C אסור לשימוש).",
  },
];

export const DEFAULT_TEST_STRIP_PARAM_IDS = ["ph", "chlorine", "alkalinity", "clarity"];

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
