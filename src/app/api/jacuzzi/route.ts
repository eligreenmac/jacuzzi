import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeProactiveMaintenance } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const jacuzzi = await prisma.jacuzzi.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ jacuzzi });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const data = await req.json();
    const {
      name,
      brand,
      model,
      volumeLiters,
      sanitizationType,
      location,
      usageFrequency,
      lastRefillDate,
      lastDeepCleanDate,
      lastFilterReplaceDate,
      testStripParams,
      emailNotificationsEnabled,
      notificationEmail,
      notifySameDayTasks,
      notifyOverdueTasks,
    } = data;

    // Update user notifications if provided
    if (
      emailNotificationsEnabled !== undefined ||
      notificationEmail !== undefined ||
      notifySameDayTasks !== undefined ||
      notifyOverdueTasks !== undefined
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailNotificationsEnabled: emailNotificationsEnabled !== undefined ? Boolean(emailNotificationsEnabled) : undefined,
          notifySameDayTasks: notifySameDayTasks !== undefined ? Boolean(notifySameDayTasks) : undefined,
          notifyOverdueTasks: notifyOverdueTasks !== undefined ? Boolean(notifyOverdueTasks) : undefined,
          notificationEmail: notificationEmail !== undefined ? notificationEmail : undefined,
        },
      });
    }

    const testStripParamsStr = testStripParams !== undefined
      ? (typeof testStripParams === "string" ? testStripParams : JSON.stringify(testStripParams))
      : undefined;

    const updatedJacuzzi = await prisma.jacuzzi.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: name || "הג'קוזי שלי",
        brand,
        model,
        volumeLiters: volumeLiters ? parseInt(volumeLiters, 10) : 1200,
        sanitizationType: sanitizationType || "CHLORINE",
        location: location || "OUTDOOR",
        usageFrequency: usageFrequency || "MEDIUM",
        lastRefillDate: lastRefillDate ? new Date(lastRefillDate) : new Date(),
        lastDeepCleanDate: lastDeepCleanDate ? new Date(lastDeepCleanDate) : new Date(),
        lastFilterReplaceDate: lastFilterReplaceDate ? new Date(lastFilterReplaceDate) : null,
        testStripParams: testStripParamsStr || '["ph","chlorine","alkalinity"]',
      },
      update: {
        name: name || undefined,
        brand: brand !== undefined ? brand : undefined,
        model: model !== undefined ? model : undefined,
        volumeLiters: volumeLiters ? parseInt(volumeLiters, 10) : undefined,
        sanitizationType: sanitizationType || undefined,
        location: location || undefined,
        usageFrequency: usageFrequency || undefined,
        lastRefillDate: lastRefillDate ? new Date(lastRefillDate) : undefined,
        lastDeepCleanDate: lastDeepCleanDate ? new Date(lastDeepCleanDate) : undefined,
        lastFilterReplaceDate: lastFilterReplaceDate !== undefined ? (lastFilterReplaceDate ? new Date(lastFilterReplaceDate) : null) : undefined,
        testStripParams: testStripParamsStr !== undefined ? testStripParamsStr : undefined,
      },
    });

    // Automatically synchronize & schedule the 90-day (3 months) Full Refill task and proactive adjustments
    if (lastRefillDate) {
      const refillDate = new Date(lastRefillDate);
      const refillFreq = 90;
      const nextRefillDate = new Date(refillDate.getTime() + refillFreq * 24 * 60 * 60 * 1000);

      const existingRefillTask = await prisma.maintenanceTask.findFirst({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: "ריקון ומילוי מים מלא" } },
            { title: { contains: "ריקון ומילוי" } },
            { title: { contains: "ריקון מלא" } },
          ],
        },
      });

      if (existingRefillTask) {
        await prisma.maintenanceTask.update({
          where: { id: existingRefillTask.id },
          data: {
            title: "ריקון ומילוי מים מלא (100%)",
            description: "ריקון ומילוי מים מלא (100%) ללא שטיפת צנרת במים טריים (מחזור של 3 חודשים).",
            frequencyDays: refillFreq,
            lastDoneDate: refillDate,
            nextDueDate: nextRefillDate,
            isCompleted: false,
            category: "QUARTERLY",
            priority: "URGENT",
          },
        });
      } else {
        await prisma.maintenanceTask.create({
          data: {
            userId: user.id,
            title: "ריקון ומילוי מים מלא (100%)",
            description: "ריקון ומילוי מים מלא (100%) ללא שטיפת צנרת במים טריים (מחזור של 3 חודשים).",
            frequencyDays: refillFreq,
            lastDoneDate: refillDate,
            nextDueDate: nextRefillDate,
            isCompleted: false,
            category: "QUARTERLY",
            priority: "URGENT",
          },
        });
      }

      // Record diary entry for initial/full refill if not already recorded for that date
      const startOfDay = new Date(refillDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(refillDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingDiary = await prisma.diaryEntry.findFirst({
        where: {
          userId: user.id,
          title: { contains: "ריקון ומילוי מים מלא" },
          entryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!existingDiary) {
        await prisma.diaryEntry.create({
          data: {
            userId: user.id,
            title: "ריקון ומילוי מים מלא (100%)",
            content: "ריקון ומילוי מים מלא (100%) ללא שטיפת צנרת במים טריים. גיל המים עודכן בהצלחה.",
            entryDate: refillDate,
            waterQualityRating: 5,
          },
        });
      }

      // Remove obsolete one-off custom tasks from previous water cycle
      await prisma.maintenanceTask.deleteMany({
        where: {
          userId: user.id,
          category: "CUSTOM",
          isCompleted: false,
        },
      });

      // AI Proactive Adaptation: analyze full refill and adjust calendar schedule shifts
      try {
        const currentTasks = await prisma.maintenanceTask.findMany({
          where: { userId: user.id, isCompleted: false },
        });

        const proactiveAnalysis = await analyzeProactiveMaintenance({
          freeText: "ריקון ומילוי מים מלא (100%) ללא שטיפת צנרת",
          actionDate: refillDate,
          volumeLiters: updatedJacuzzi.volumeLiters,
          sanitizationType: updatedJacuzzi.sanitizationType,
          lastRefillDate: refillDate,
          currentTasks: currentTasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            frequencyDays: t.frequencyDays,
            nextDueDate: t.nextDueDate,
          })),
        });

        if (proactiveAnalysis?.scheduleShifts && Array.isArray(proactiveAnalysis.scheduleShifts)) {
          for (const shift of proactiveAnalysis.scheduleShifts) {
            if (shift.taskId && shift.newDueDate) {
              await prisma.maintenanceTask.updateMany({
                where: { id: shift.taskId, userId: user.id },
                data: {
                  nextDueDate: new Date(shift.newDueDate),
                  description: shift.reason ? `עודכן בעקבות מילוי מים: ${shift.reason}` : undefined,
                },
              });
            }
          }
        }
      } catch (aiErr) {
        console.warn("Proactive schedule shift error on refill update:", aiErr);
      }
    }

    // Automatically synchronize & schedule the 90-day (3 months) Pipe Flush task in Calendar
    if (lastDeepCleanDate) {
      const cleanDate = new Date(lastDeepCleanDate);
      const nextCleanDate = new Date(cleanDate.getTime() + 90 * 24 * 60 * 60 * 1000);

      const existingDeepCleanTask = await prisma.maintenanceTask.findFirst({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: "שטיפת צנרת" } },
            { title: { contains: "ניקוי צנרת" } },
            { title: { contains: "Flush" } },
            { category: "QUARTERLY" },
          ],
        },
      });

      if (existingDeepCleanTask) {
        await prisma.maintenanceTask.update({
          where: { id: existingDeepCleanTask.id },
          data: {
            title: "שטיפת צנרת (Biofilm Flush), ריקון ומילוי מים חדשים",
            description: "הוספת חומר שטיפת צנרת, הפעלת ג'טים, ריקון מלא, ניקוי דפנות ומילוי מים חדשים ורעננים (מחזור של 3 חודשים).",
            frequencyDays: 90,
            lastDoneDate: cleanDate,
            nextDueDate: nextCleanDate,
            isCompleted: false,
            category: "QUARTERLY",
            priority: "URGENT",
          },
        });
      } else {
        await prisma.maintenanceTask.create({
          data: {
            userId: user.id,
            title: "שטיפת צנרת (Biofilm Flush), ריקון ומילוי מים חדשים",
            description: "הוספת חומר שטיפת צנרת, הפעלת ג'טים, ריקון מלא, ניקוי דפנות ומילוי מים חדשים ורעננים (מחזור של 3 חודשים).",
            frequencyDays: 90,
            lastDoneDate: cleanDate,
            nextDueDate: nextCleanDate,
            isCompleted: false,
            category: "QUARTERLY",
            priority: "URGENT",
          },
        });
      }
    }

    // Automatically synchronize & schedule the 365-day (12 months) Filter Replacement task in Calendar
    if (lastFilterReplaceDate) {
      const replaceDate = new Date(lastFilterReplaceDate);
      const nextReplaceDate = new Date(replaceDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      const existingFilterTask = await prisma.maintenanceTask.findFirst({
        where: {
          userId: user.id,
          OR: [
            { title: { contains: "החלפת פילטר" } },
            { title: { contains: "פילטר חדש" } },
            { title: { contains: "החלפת מסנן" } },
            { category: "ANNUAL" },
          ],
        },
      });

      if (existingFilterTask) {
        await prisma.maintenanceTask.update({
          where: { id: existingFilterTask.id },
          data: {
            title: "החלפת פילטר חדש (שנתי)",
            description: "החלפת מחסנית סינון ישנה בפילטר חדש ונקי לשמירה על צלילות המים ותקינות המשאבה (מחזור שנתי).",
            frequencyDays: 365,
            lastDoneDate: replaceDate,
            nextDueDate: nextReplaceDate,
            isCompleted: false,
            category: "ANNUAL",
            priority: "MEDIUM",
          },
        });
      } else {
        await prisma.maintenanceTask.create({
          data: {
            userId: user.id,
            title: "החלפת פילטר חדש (שנתי)",
            description: "החלפת מחסנית סינון ישנה בפילטר חדש ונקי לשמירה על צלילות המים ותקינות המשאבה (מחזור שנתי).",
            frequencyDays: 365,
            lastDoneDate: replaceDate,
            nextDueDate: nextReplaceDate,
            isCompleted: false,
            category: "ANNUAL",
            priority: "MEDIUM",
          },
        });
      }
    }

    return NextResponse.json({ success: true, jacuzzi: updatedJacuzzi });
  } catch (error: any) {
    console.error("Jacuzzi update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
