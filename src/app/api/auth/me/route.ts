import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma, ensureDbSchema, withRetry } from "@/lib/prisma";

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

    const { passwordHash: _, ...safeUser } = fullUserData;

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

    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת נתוני משתמש" }, { status: 500 });
  }
}
