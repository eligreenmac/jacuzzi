import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }

    const fullUserData = await prisma.user.findUnique({
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
          take: 5,
        },
      },
    });

    if (!fullUserData) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }

    const { passwordHash: _, ...safeUser } = fullUserData;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת נתוני משתמש" }, { status: 500 });
  }
}
