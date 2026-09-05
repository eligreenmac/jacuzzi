import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, ensureDbSchema } from "@/lib/prisma";
import { isAdminUser, getUserSubscriptionInfo } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    await ensureDbSchema();

    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "משתמש לא מחובר" }, { status: 401 });
    }

    if (!isAdminUser(currentUser.email)) {
      return NextResponse.json({
        error: "גישה נדחתה: פעולה זו מורשית אך ורק למנהל המערכת (Admin).",
      }, { status: 403 });
    }

    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        jacuzzi: {
          select: { name: true, volumeLiters: true, sanitizationType: true },
        },
        _count: {
          select: { waterLogs: true, tasks: true, chemicals: true },
        },
      },
    });

    let totalUsers = allUsers.length;
    let activeSubscribers = 0;
    let trialUsers = 0;
    let expiredUsers = 0;
    let adminUsers = 0;

    const formattedUsers = allUsers.map((u) => {
      const sub = getUserSubscriptionInfo(u);

      if (sub.isAdmin) {
        adminUsers++;
      } else if (sub.status === "ACTIVE") {
        activeSubscribers++;
      } else if (sub.status === "TRIAL") {
        trialUsers++;
      } else {
        expiredUsers++;
      }

      return {
        id: u.id,
        email: u.email,
        name: u.name || u.email.split("@")[0],
        createdAt: u.createdAt,
        trialEndsAt: u.trialEndsAt,
        subscriptionStatus: u.subscriptionStatus,
        stripeCustomerId: u.stripeCustomerId,
        currentPeriodEnd: u.currentPeriodEnd,
        jacuzziName: u.jacuzzi?.name || "ללא ג'קוזי",
        waterLogsCount: u._count.waterLogs,
        tasksCount: u._count.tasks,
        chemicalsCount: u._count.chemicals,
        subDetails: sub,
      };
    });

    const stats = {
      totalUsers,
      activeSubscribers,
      trialUsers,
      expiredUsers,
      adminUsers,
      estimatedMonthlyRevenueUSD: activeSubscribers * 5,
    };

    return NextResponse.json({ stats, users: formattedUsers });
  } catch (err: any) {
    console.error("Error fetching admin users:", err);
    return NextResponse.json({
      error: err.message || "שגיאה בטעינת נתוני משתמשים",
    }, { status: 500 });
  }
}
