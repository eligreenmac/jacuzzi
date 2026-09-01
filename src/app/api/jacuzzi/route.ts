import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      },
    });

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

    return NextResponse.json({ success: true, jacuzzi: updatedJacuzzi });
  } catch (error: any) {
    console.error("Jacuzzi update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
