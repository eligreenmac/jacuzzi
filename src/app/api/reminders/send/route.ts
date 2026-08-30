import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminderEmail, TaskEmailItem } from "@/lib/mailer";

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

async function processReminders(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const sendAll = searchParams.get("sendAll") === "true";

    let targetUsers = [];

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (user) {
      // User triggered for themselves
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          jacuzzi: true,
          tasks: {
            where: {
              isCompleted: false,
              ...(sendAll ? {} : { nextDueDate: { lte: endOfToday } }),
            },
            orderBy: { nextDueDate: "asc" },
          },
        },
      });
      if (fullUser) targetUsers.push(fullUser);
    } else {
      // Automated Cron / Background trigger: find users with email notifications enabled
      const authKey = req.headers.get("x-cron-key");
      const expectedKey = process.env.CRON_SECRET || "jacuzzi-cron-2026";

      // If called with a cron key or from internal scheduler
      if (authKey && authKey !== expectedKey) {
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
              nextDueDate: { lte: endOfToday }, // Tasks that expired or are due today!
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

      const notifySameDay = u.notifySameDayTasks ?? true;
      const notifyOverdue = u.notifyOverdueTasks ?? true;

      // Filter and annotate tasks according to user granular preferences
      const overdueOrDueTasks: TaskEmailItem[] = u.tasks
        .map((t) => {
          const dueDate = new Date(t.nextDueDate);
          const dueToday = isSameDay(dueDate, now);
          const overdue = dueDate < startOfToday;
          const diffMs = startOfToday.getTime() - dueDate.getTime();
          const overdueDays = overdue ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

          return {
            title: t.title,
            description: t.description,
            dueDate: t.nextDueDate,
            priority: t.priority,
            isDueToday: dueToday,
            isOverdue: overdue,
            overdueDays: overdueDays,
          };
        })
        .filter((item) => {
          if (sendAll) return true; // Explicit manual full test
          if (item.isDueToday && notifySameDay) return true;
          if (item.isOverdue && notifyOverdue) return true;
          return false;
        });

      // If user has NO overdue/due tasks matching their preferences
      if (overdueOrDueTasks.length === 0) {
        results.push({
          email,
          skipped: true,
          message: "אין משימות תואמות להגדרות ההתראות שנבחרו (היום/באיחור).",
          tasksDueCount: 0,
        });
        continue;
      }

      const res = await sendMaintenanceReminderEmail({
        to: email,
        userName: u.name || "משתמש ג'קוזי",
        jacuzziName: u.jacuzzi?.name || "הג'קוזי שלך",
        tasks: overdueOrDueTasks,
      });

      results.push({
        email,
        success: res.success,
        provider: res.provider,
        previewUrl: res.previewUrl,
        error: res.error,
        tasksDueCount: overdueOrDueTasks.length,
        dueTasks: overdueOrDueTasks.map((t) => ({
          title: t.title,
          isDueToday: t.isDueToday,
          isOverdue: t.isOverdue,
          overdueDays: t.overdueDays,
        })),
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

export async function POST(req: NextRequest) {
  return processReminders(req);
}

export async function GET(req: NextRequest) {
  return processReminders(req);
}
