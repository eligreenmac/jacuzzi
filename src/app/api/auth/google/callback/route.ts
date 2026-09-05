import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbSchema, withRetry } from "@/lib/prisma";
import { signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getDefaultMaintenanceTasks } from "@/lib/jacuzzi-calc";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function getCanonicalOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    return `${protocol}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "https://jacuzzi-five.vercel.app";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = getCanonicalOrigin(req);

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  try {
    await ensureDbSchema();

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      const errDetail = tokenData.error_description || tokenData.error || "google_auth_failed";
      return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(errDetail)}`);
    }

    // 2. Extract User Profile (first from id_token, then from userinfo endpoints as fallback)
    let email = "";
    let name = "";

    // A. Direct decode from id_token (fastest & most reliable)
    if (tokenData.id_token) {
      try {
        const decoded = jwt.decode(tokenData.id_token) as any;
        if (decoded?.email) {
          email = decoded.email.toLowerCase().trim();
          name = decoded.name || decoded.given_name || "";
        }
      } catch (e) {
        console.error("Error decoding id_token:", e);
      }
    }

    // B. Fetch from Google v3 userinfo endpoint if needed
    if (!email) {
      try {
        const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (userRes.ok) {
          const googleUser = await userRes.json();
          if (googleUser?.email) {
            email = googleUser.email.toLowerCase().trim();
            if (!name) name = googleUser.name || googleUser.given_name || "";
          }
        }
      } catch (e) {
        console.error("Error fetching v3 userinfo:", e);
      }
    }

    // C. Fetch from Google v2 userinfo endpoint as secondary fallback
    if (!email) {
      try {
        const v2Res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (v2Res.ok) {
          const v2User = await v2Res.json();
          if (v2User?.email) {
            email = v2User.email.toLowerCase().trim();
            if (!name) name = v2User.name || v2User.given_name || "";
          }
        }
      } catch (e) {
        console.error("Error fetching v2 userinfo:", e);
      }
    }

    if (!email) {
      console.error("Google Auth: No email found in id_token or userinfo", tokenData);
      return NextResponse.redirect(`${appUrl}/login?error=google_no_email`);
    }

    if (!name) {
      name = email.includes("eligreen") ? "אלי גרין" : email.split("@")[0];
    }

    // 3. Find or Create user in database with retry
    let user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { email },
        include: { jacuzzi: true },
      });
    });

    if (!user) {
      const dummyPassword = await bcrypt.hash(Math.random().toString(36) + "google_auth_random", 10);
      user = await withRetry(async () => {
        return await prisma.user.create({
          data: {
            email,
            name,
            passwordHash: dummyPassword,
            notificationEmail: email,
            emailNotificationsEnabled: true,
            notifySameDayTasks: true,
            notifyOverdueTasks: true,
            jacuzzi: {
              create: {
                name: "הג'קוזי של " + name,
                volumeLiters: 1200,
                sanitizationType: "CHLORINE",
                location: "OUTDOOR",
                usageFrequency: "MEDIUM",
                lastRefillDate: new Date(),
                lastDeepCleanDate: new Date(),
              },
            },
          },
          include: { jacuzzi: true },
        });
      });

      // Initialize default tasks for new user
      if (user && user.jacuzzi) {
        const userId = user.id;
        const defaultTasks = getDefaultMaintenanceTasks({
          volumeLiters: user.jacuzzi.volumeLiters,
          sanitizationType: user.jacuzzi.sanitizationType,
        });

        for (const task of defaultTasks) {
          const dueDate = task.nextDueDate ? new Date(task.nextDueDate) : new Date();
          if (!task.nextDueDate) {
            dueDate.setDate(dueDate.getDate() + (task.frequencyDays || 7));
          }

          await withRetry(async () => {
            await prisma.maintenanceTask.create({
              data: {
                userId,
                title: task.title,
                description: task.description,
                category: task.category,
                frequencyDays: task.frequencyDays,
                nextDueDate: dueDate,
                priority: task.priority,
              },
            });
          });
        }
      }
    }

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=user_creation_failed`);
    }

    // 4. Create Session JWT & Set Cookie
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    });

    const response = NextResponse.redirect(`${appUrl}/`);
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Google Auth Exception:", err);
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(err?.message || "server_error")}`);
  }
}
