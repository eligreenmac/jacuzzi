import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, ensureDbSchema } from "@/lib/prisma";

export const DEFAULT_ROUTINES_CONFIG = [
  {
    key: "WATER_TEST",
    title: "בדיקת איכות מים וחיטוי שבועית (מקלון)",
    description: "בדיקת מקלון (pH, כלור/ברום ובסיסיות). איזון לפי הצורך והוספת חומר חיטוי שבועי.",
    category: "WEEKLY",
    defaultFrequencyDays: 7,
    minDays: 1,
    maxDays: 30,
    priority: "HIGH",
    icon: "FlaskConical",
    explanation: "בדיקת המקלון השבועית היא עמוד השדרה של בריאות הג'קוזי. היא מאפשרת גילוי מוקדם של סטיות בחומציות או ברמת החיטוי לפני שמתפתחים עכירות, אצות או גירויים בעור.",
  },
  {
    key: "FILTER_WASH",
    title: "שטיפת פילטר שבועית בזרם מים",
    description: "הוצאת מסנן הג'קוזי ושטיפה יסודית בלחץ מים להסרת לכלוך ושומנים שהצטברו.",
    category: "WEEKLY",
    defaultFrequencyDays: 7,
    minDays: 2,
    maxDays: 30,
    priority: "MEDIUM",
    icon: "Droplets",
    explanation: "הפילטר לוכד לכלוך גס, שומני גוף ושאריות קרמים. שטיפה שבועית בזרם מים חזק שומרת על סירקולציה תקינה וחוסכת עד 40% בצריכת הכימיקלים.",
  },
  {
    key: "SHOCK",
    title: "שוק חיטוי שבועי (Non-Chlorine Shock / כלור מהיר)",
    description: "הוספת מכת שוק לחימצון תרכובות אורגניות, מניעת ריחות והחזרת צלילות המים.",
    category: "WEEKLY",
    defaultFrequencyDays: 7,
    minDays: 3,
    maxDays: 60,
    priority: "HIGH",
    icon: "Zap",
    explanation: "מכת שוק מחמצנת (MPS) מפרקת תרכובות שומניות, כלוראמינים (כלור קשור) וחומרים אורגניים שחומר החיטוי הרגיל לא מצליח לפרק, ומונעת ריח חריף והקצפה.",
  },
  {
    key: "FILTER_DEEP_CLEAN",
    title: "ניקוי פילטר עמוק בהשריה חודשית",
    description: "השרית הפילטר בדלי עם נוזל ניקוי פילטרים ייעודי למשך 12-24 שעות להמסת שומני גוף עמוקים ואבנית.",
    category: "MONTHLY",
    defaultFrequencyDays: 30,
    minDays: 14,
    maxDays: 90,
    priority: "MEDIUM",
    icon: "Sparkles",
    explanation: "מים בלבד לא ממיסים שומנים ואבנית שנספגו בעומק סיבי הפילטר. השריה חודשית ממיסה את השומנים לחלוטין ומחזירה לפילטר את כושר הסינון המקורי שלו.",
  },
  {
    key: "COVER_CARE",
    title: "בדיקת אטימות וטיפוח כיסוי תרמי",
    description: "ניקוי וייבוש הכיסוי התרמי ומריחת ספריי הגנה מקרני UV למניעת סדקים וריחות.",
    category: "MONTHLY",
    defaultFrequencyDays: 30,
    minDays: 14,
    maxDays: 120,
    priority: "LOW",
    icon: "Shield",
    explanation: "הכיסוי התרמי שומר על החום ומונע אידוי מים וכימיקלים. טיפוח עם ספריי UV מונע יובש וסדקים ושומר על אטימות ובידוד מקסימלי.",
  },
  {
    key: "DRAIN_AND_REFILL",
    title: "שטיפת צנרת (Biofilm Flush), ריקון ומילוי מים חדשים",
    description: "הוספת חומר שטיפת צנרת, הפעלת ג'טים, ריקון מלא, ניקוי דפנות ומילוי מים חדשים ורעננים (מחזור מומלץ של 90 ימים).",
    category: "QUARTERLY",
    defaultFrequencyDays: 90,
    minDays: 30,
    maxDays: 180,
    priority: "URGENT",
    icon: "RotateCcw",
    explanation: "עם הזמן, המים צוברים מוצקים מומסים (TDS) ואינם מגיבים עוד לכימיקלים. שטיפת צנרת ממיסה ביופילם מתוך הצינורות הנסתרים ומבטיחה מים רעננים, בריאים וקלים לאיזון.",
  },
];

export async function GET(req: NextRequest) {
  try {
    await ensureDbSchema();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const tasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    // Map each standard routine to current task state
    const routines = DEFAULT_ROUTINES_CONFIG.map((def) => {
      const match = tasks.find((t) => {
        if (def.key === "WATER_TEST") return t.title.includes("בדיקת מים") || t.title.includes("מקלון") || t.title.includes("איכות מים");
        if (def.key === "FILTER_WASH") return t.title.includes("שטיפת פילטר") || (t.title.includes("פילטר") && t.frequencyDays < 20);
        if (def.key === "SHOCK") return t.title.includes("שוק");
        if (def.key === "FILTER_DEEP_CLEAN") return t.title.includes("השריה") || (t.title.includes("פילטר") && t.frequencyDays >= 20);
        if (def.key === "COVER_CARE") return t.title.includes("כיסוי");
        if (def.key === "DRAIN_AND_REFILL") return t.title.includes("צנרת") || t.title.includes("ריקון") || t.title.includes("החלפת מים");
        return false;
      });

      return {
        ...def,
        taskId: match?.id || null,
        currentFrequencyDays: match?.frequencyDays || def.defaultFrequencyDays,
        currentPriority: match?.priority || def.priority,
        nextDueDate: match?.nextDueDate ? new Date(match.nextDueDate).toISOString() : null,
        lastDoneDate: match?.lastDoneDate ? new Date(match.lastDoneDate).toISOString() : null,
        isCompleted: match?.isCompleted || false,
        isActive: true,
      };
    });

    return NextResponse.json({ routines });
  } catch (error: any) {
    console.error("GET routines error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureDbSchema();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const { routines } = body;

    if (!routines || !Array.isArray(routines)) {
      return NextResponse.json({ error: "נתוני שגרה שגויים" }, { status: 400 });
    }

    const now = new Date();
    let updatedTasksCount = 0;

    for (const item of routines) {
      const freq = parseInt(item.frequencyDays || item.currentFrequencyDays, 10) || 7;
      const priority = item.priority || item.currentPriority || "MEDIUM";

      // Find matching existing task
      let task = null;
      if (item.taskId) {
        task = await prisma.maintenanceTask.findFirst({
          where: { id: item.taskId, userId: user.id },
        });
      }

      if (!task) {
        task = await prisma.maintenanceTask.findFirst({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: item.title.slice(0, 10) } },
              { category: item.category },
            ],
          },
        });
      }

      // Calculate new nextDueDate based on new frequency
      let nextDue: Date;
      if (task?.lastDoneDate) {
        nextDue = new Date(new Date(task.lastDoneDate).getTime() + freq * 24 * 3600 * 1000);
        // If calculated date is in the past, schedule from now
        if (nextDue.getTime() < now.getTime()) {
          nextDue = new Date(now.getTime() + freq * 24 * 3600 * 1000);
        }
      } else {
        nextDue = new Date(now.getTime() + freq * 24 * 3600 * 1000);
      }

      if (task) {
        await prisma.maintenanceTask.update({
          where: { id: task.id },
          data: {
            frequencyDays: freq,
            priority,
            nextDueDate: nextDue,
            category: item.category || task.category,
            title: item.title || task.title,
            description: item.description || task.description,
          },
        });
        updatedTasksCount++;
      } else {
        await prisma.maintenanceTask.create({
          data: {
            userId: user.id,
            title: item.title,
            description: item.description,
            category: item.category || "WEEKLY",
            frequencyDays: freq,
            priority,
            nextDueDate: nextDue,
            isCompleted: false,
          },
        });
        updatedTasksCount++;
      }
    }

    // Record in diary
    await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        title: "עדכון והתאמת שגרות תחזוקה",
        content: `עודכנו בהצלחה תדירויות התחזוקה עבור ${updatedTasksCount} שגרות ביומן. לוח המשימות סונכרן מחדש בהתאם להגדרות המשתמש.`,
        waterQualityRating: 5,
      },
    });

    return NextResponse.json({ success: true, updatedTasksCount });
  } catch (error: any) {
    console.error("PUT routines error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
