import { prisma } from "@/lib/prisma";

export interface WaterTestValues {
  ph?: number | null;
  phRange?: string | null;
  freeChlorine?: number | null;
  chlorineRange?: string | null;
  alkalinity?: number | null;
  alkalinityRange?: string | null;
  waterClarity?: string | null;
  testedAt?: Date | string | null;
}

/**
 * Reconciles and auto-closes open corrective tasks from previous water tests
 * when parameters have balanced themselves out or are confirmed healthy in a new test.
 */
export async function reconcileWaterTasks(
  userId: string,
  latestLog: WaterTestValues
) {
  try {
    // 1. Determine parameter health states
    const isPhBalanced =
      (typeof latestLog.ph === "number" && latestLog.ph >= 7.2 && latestLog.ph <= 7.8) ||
      (latestLog.phRange &&
        (latestLog.phRange.includes("OK") ||
          latestLog.phRange.includes("תקין") ||
          latestLog.phRange.includes("OPTIMAL") ||
          latestLog.phRange.includes("אידיאלי")));

    const isChlorineBalanced =
      (typeof latestLog.freeChlorine === "number" &&
        latestLog.freeChlorine >= 1.5 &&
        latestLog.freeChlorine <= 5.5) ||
      (latestLog.chlorineRange &&
        (latestLog.chlorineRange.includes("OK") ||
          latestLog.chlorineRange.includes("תקין") ||
          latestLog.chlorineRange.includes("OPTIMAL") ||
          latestLog.chlorineRange.includes("אידיאלי")));

    const isAlkalinityBalanced =
      (typeof latestLog.alkalinity === "number" &&
        latestLog.alkalinity >= 80 &&
        latestLog.alkalinity <= 140) ||
      (latestLog.alkalinityRange &&
        (latestLog.alkalinityRange.includes("OK") ||
          latestLog.alkalinityRange.includes("תקינה") ||
          latestLog.alkalinityRange.includes("OPTIMAL") ||
          latestLog.alkalinityRange.includes("אידיאלי")));

    const isClarityClear =
      !latestLog.waterClarity ||
      latestLog.waterClarity === "CLEAR" ||
      latestLog.waterClarity === "צלול";

    // 2. Fetch pending, uncompleted tasks
    const openTasks = await prisma.maintenanceTask.findMany({
      where: {
        userId,
        isCompleted: false,
      },
    });

    const resolvedTasks: Array<{ id: string; title: string; reason: string }> = [];
    const testDate = latestLog.testedAt ? new Date(latestLog.testedAt) : new Date();

    for (const t of openTasks) {
      const title = t.title || "";
      const desc = t.description || "";
      const isOneTime =
        t.category === "CUSTOM" ||
        title.includes("חוזרת") ||
        title.includes("מעקב") ||
        title.includes("ראשונית") ||
        t.frequencyDays <= 1;

      // === A. pH Corrective & Follow-Up Tasks ===
      const isPhTask =
        title.includes("pH") ||
        title.includes("חומציות") ||
        title.includes("מוריד pH") ||
        title.includes("מעלה pH") ||
        title.includes("איזון pH") ||
        desc.includes("מוריד pH") ||
        desc.includes("מעלה pH") ||
        desc.includes("חומציות");

      if (isPhTask && isPhBalanced && isOneTime) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: {
            isCompleted: true,
            lastDoneDate: testDate,
            lastValueAfter: `איזון עצמי/תקין: ${latestLog.ph ? `pH ${latestLog.ph}` : latestLog.phRange || "תקין"}`,
          },
        });
        resolvedTasks.push({
          id: t.id,
          title: t.title,
          reason: `רמת ה-pH נמדדה כתקינה ומאוזנת (${latestLog.ph ? `pH ${latestLog.ph}` : latestLog.phRange || "תקין"}) - המשימה נסגרה אוטומטית.`,
        });
        continue;
      }

      // === B. Sanitizer (Chlorine/Bromine) Corrective Tasks ===
      const isSanitizerTask =
        (title.includes("כלור") ||
          title.includes("ברום") ||
          title.includes("חיטוי") ||
          desc.includes("כלור") ||
          desc.includes("ברום")) &&
        !title.includes("שוק") &&
        !title.includes("שבועית") &&
        isOneTime;

      if (isSanitizerTask && isChlorineBalanced) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: {
            isCompleted: true,
            lastDoneDate: testDate,
            lastValueAfter: `חיטוי תקין: ${latestLog.freeChlorine ? `${latestLog.freeChlorine} ppm` : latestLog.chlorineRange || "תקין"}`,
          },
        });
        resolvedTasks.push({
          id: t.id,
          title: t.title,
          reason: `רמת החיטוי נמדדה כתקינה ומאוזנת - המשימה נסגרה אוטומטית.`,
        });
        continue;
      }

      // === C. Alkalinity (TA) Corrective Tasks ===
      const isAlkTask =
        (title.includes("בסיסיות") ||
          title.includes("Alkalinity") ||
          title.includes("TA") ||
          desc.includes("בסיסיות")) &&
        isOneTime;

      if (isAlkTask && isAlkalinityBalanced) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: {
            isCompleted: true,
            lastDoneDate: testDate,
            lastValueAfter: `בסיסיות תקינה: ${latestLog.alkalinity ? `${latestLog.alkalinity} ppm` : latestLog.alkalinityRange || "תקין"}`,
          },
        });
        resolvedTasks.push({
          id: t.id,
          title: t.title,
          reason: `רמת הבסיסיות נמדדה כתקינה ומאוזנת - המשימה נסגרה אוטומטית.`,
        });
        continue;
      }

      // === D. Water Clarity & Foam Corrective Tasks ===
      const isClarityTask =
        (title.includes("עכירות") ||
          title.includes("מבהיר מים") ||
          title.includes("הקצפה") ||
          title.includes("קצף")) &&
        isOneTime;

      if (isClarityTask && isClarityClear) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: {
            isCompleted: true,
            lastDoneDate: testDate,
            lastValueAfter: "מים צלולים ותקינים",
          },
        });
        resolvedTasks.push({
          id: t.id,
          title: t.title,
          reason: "המים נבדקו כצלולים לחלוטין - המשימה נסגרה אוטומטית.",
        });
        continue;
      }

      // === E. Generic Follow-up Strip Test Tasks ===
      const isFollowupTestTask =
        (title.includes("ראשונית") ||
          title.includes("חוזרת") ||
          title.includes("מעקב")) &&
        (title.includes("בדיק") || title.includes("מקלון")) &&
        isOneTime;

      if (isFollowupTestTask) {
        await prisma.maintenanceTask.update({
          where: { id: t.id },
          data: {
            isCompleted: true,
            lastDoneDate: testDate,
            lastValueAfter: "בוצעה בדיקת מים עדכנית",
          },
        });
        resolvedTasks.push({
          id: t.id,
          title: t.title,
          reason: "בוצעה בדיקת מים חדשה - משימת המעקב הושלמה אוטומטית.",
        });
        continue;
      }
    }

    // Record diary log if any tasks were auto-resolved
    if (resolvedTasks.length > 0) {
      const summary = resolvedTasks.map((r) => `• ${r.title}: ${r.reason}`).join("\n");
      await prisma.diaryEntry.create({
        data: {
          userId,
          title: `סנכרון וביטול משימות אוטומטי בעקבות בדיקת מים`,
          content: `בעקבות תוצאות בדיקת המים העדכנית, זוהו ${resolvedTasks.length} משימות שהתייתרו כיוון שהערכים התאזנו:\n${summary}`,
          waterQualityRating: 5,
        },
      });
    }

    return resolvedTasks;
  } catch (err) {
    console.error("Error in reconcileWaterTasks:", err);
    return [];
  }
}
