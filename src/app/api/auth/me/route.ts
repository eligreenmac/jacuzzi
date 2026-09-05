import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma, ensureDbSchema, withRetry } from "@/lib/prisma";
import { getUserSubscriptionInfo, isAdminUser } from "@/lib/subscription";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await ensureDbSchema();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const fullUserData = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          jacuzzi: true,
          chemicals: true,
          tasks: {
            orderBy: { nextDueDate: "asc" },
          },
          waterLogs: {
            orderBy: { testedAt: "desc" },
            take: 5,
          },
          diaryEntries: {
            orderBy: { entryDate: "desc" },
            take: 100,
          },
        },
      });
    });

    if (!fullUserData) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }

    const { passwordHash: _, ...safeUser } = fullUserData as any;

    // Attach subscription and admin details
    safeUser.isAdmin = isAdminUser(safeUser.email);
    safeUser.subscriptionDetails = getUserSubscriptionInfo(safeUser);

    // Ensure no purchase entries leak into maintenance diary
    safeUser.diaryEntries = (safeUser.diaryEntries || []).filter((d: any) => {
      const text = `${d.title || ""} ${d.content || ""}`.toLowerCase();
      return (
        !text.includes("רכש") &&
        !text.includes("חומרים חסרים") &&
        !text.includes("מומלצים לרכש") &&
        !text.includes("להזמין")
      );
    });

    return NextResponse.json(
      { user: safeUser },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת נתוני משתמש" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDbSchema();
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    await withRetry(async () => {
      return await prisma.user.delete({
        where: { id: sessionUser.id },
      });
    });

    const response = NextResponse.json({
      success: true,
      message: "החשבון וכל נתוניו נמחקו בהצלחה",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error: any) {
    console.error("Delete Account Error:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת החשבון. נסה שוב מאוחר יותר." },
      { status: 500 }
    );
  }
}
