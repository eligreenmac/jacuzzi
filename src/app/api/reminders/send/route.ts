import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminderEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    let targetUsers = [];

    if (user) {
      // User requested explicit reminder for themselves
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          jacuzzi: true,
          tasks: {
            where: { isCompleted: false },
            orderBy: { nextDueDate: "asc" },
          },
        },
      });
      if (fullUser) targetUsers.push(fullUser);
    } else {
      // Cron / Background automated trigger: find all users with email notifications enabled
      const authKey = req.headers.get("x-cron-key");
      const expectedKey = process.env.CRON_SECRET || "jacuzzi-cron-2026";
      
      if (authKey !== expectedKey) {
        return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
      }

      targetUsers = await prisma.user.findMany({
        where: {
          emailNotificationsEnabled: true,
        },
        include: {
          jacuzzi: true,
          tasks: {
            where: {
              isCompleted: false,
              nextDueDate: {
                lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in the next 2 days or overdue
              },
            },
            orderBy: { nextDueDate: "asc" },
          },
        },
      });
    }

    const results = [];

    for (const u of targetUsers) {
      const email = u.notificationEmail || u.email;
      if (!email) continue;

      const tasksToSend = u.tasks.length > 0
        ? u.tasks.map((t) => ({
            title: t.title,
            description: t.description,
            dueDate: t.nextDueDate,
            priority: t.priority,
          }))
        : [
            {
              title: "בדיקת שגרה וצלילות מים",
              description: "כל המשימות מעודכנות! מומלץ לבדוק את צלילות המים ורמת החיטוי בסופ\"ש.",
              dueDate: new Date(),
              priority: "LOW",
            },
          ];

      const res = await sendMaintenanceReminderEmail({
        to: email,
        userName: u.name || "משתמש ג'קוזי",
        jacuzziName: u.jacuzzi?.name || "הג'קוזי שלך",
        tasks: tasksToSend,
      });

      results.push({
        email,
        success: res.success,
        mock: res.mock,
        error: res.error,
        tasksCount: tasksToSend.length,
      });
    }

    return NextResponse.json({
      success: true,
      processedUsers: targetUsers.length,
      results,
    });
  } catch (error: any) {
    console.error("Reminder dispatch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
