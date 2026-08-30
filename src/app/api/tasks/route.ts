import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const tasks = await prisma.maintenanceTask.findMany({
      where: { userId: user.id },
      orderBy: { nextDueDate: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { title, description, category, frequencyDays, nextDueDate, priority } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "כותרת משימה היא שדה חובה" }, { status: 400 });
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        category: category || "CUSTOM",
        frequencyDays: frequencyDays ? parseInt(frequencyDays, 10) : 7,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : new Date(),
        priority: priority || "MEDIUM",
        isCompleted: false,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { id, isCompleted, markDoneAndReschedule, nextDueDate, title, description, priority } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "מזהה משימה חסר" }, { status: 400 });
    }

    const existing = await prisma.maintenanceTask.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "משימה לא נמצאה" }, { status: 404 });
    }

    let updateData: any = {};

    if (markDoneAndReschedule) {
      // Mark as done today, calculate next recurring date
      const now = new Date();
      const nextDate = new Date(now.getTime() + existing.frequencyDays * 24 * 60 * 60 * 1000);
      updateData = {
        lastDoneDate: now,
        nextDueDate: nextDate,
        isCompleted: false,
      };

      // Also log this in the diary!
      await prisma.diaryEntry.create({
        data: {
          userId: user.id,
          title: `בוצע טיפול: ${existing.title}`,
          content: existing.description || "בוצע טיפול תחזוקה שוטף על פי לוח הזמנים.",
          waterQualityRating: 5,
        },
      });
    } else {
      if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
      if (nextDueDate !== undefined) updateData.nextDueDate = new Date(nextDueDate);
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
    }

    const updated = await prisma.maintenanceTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "מזהה משימה חסר" }, { status: 400 });
    }

    await prisma.maintenanceTask.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
