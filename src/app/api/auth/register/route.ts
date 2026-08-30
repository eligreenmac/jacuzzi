import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getDefaultMaintenanceTasks } from "@/lib/jacuzzi-calc";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, jacuzziName, volumeLiters, sanitizationType, location, usageFrequency } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "אימייל וסיסמה הם שדות חובה" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "משתמש עם כתובת אימייל זו כבר קיים במערכת" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create User, Jacuzzi, and initial maintenance tasks
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name || "משתמש ג'קוזי",
        notificationEmail: normalizedEmail,
        emailNotificationsEnabled: true,
        jacuzzi: {
          create: {
            name: jacuzziName || "הג'קוזי שלי",
            volumeLiters: volumeLiters ? parseInt(volumeLiters, 10) : 1200,
            sanitizationType: sanitizationType || "CHLORINE",
            location: location || "OUTDOOR",
            usageFrequency: usageFrequency || "MEDIUM",
            lastRefillDate: new Date(),
            lastDeepCleanDate: new Date(),
          },
        },
      },
      include: {
        jacuzzi: true,
      },
    });

    // Populate standard maintenance schedule
    if (user.jacuzzi) {
      const defaultTasks = getDefaultMaintenanceTasks({
        volumeLiters: user.jacuzzi.volumeLiters,
        sanitizationType: user.jacuzzi.sanitizationType,
      });

      for (const t of defaultTasks) {
        await prisma.maintenanceTask.create({
          data: {
            userId: user.id,
            title: t.title,
            description: t.description,
            category: t.category,
            frequencyDays: t.frequencyDays,
            nextDueDate: t.nextDueDate,
            priority: t.priority,
          },
        });
      }
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        jacuzzi: user.jacuzzi,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "שגיאה ביצירת המשתמש" }, { status: 500 });
  }
}
