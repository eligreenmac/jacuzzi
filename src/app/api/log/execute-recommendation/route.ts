import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

    const body = await req.json();
    const {
      testId,
      stepNumber,
      title,
      chemical,
      amount,
      instructions,
      inventoryItemId,
      actionType = "EXECUTE_NOW", // "EXECUTE_NOW" | "SCHEDULE_FUTURE" | "COMPLETE_SCHEDULED"
      hoursAhead = 24,
      notes,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "פרטי המלצה חסרים" }, { status: 400 });
    }

    // === CASE 1: SCHEDULE FUTURE TASK (הכנס ליומן / תזמן ללוח השנה) ===
    if (actionType === "SCHEDULE_FUTURE") {
      const scheduledDate = new Date(Date.now() + (hoursAhead || 24) * 3600 * 1000);
      const task = await prisma.maintenanceTask.create({
        data: {
          userId: user.id,
          title,
          description: instructions || `פעולת המשך מתוזמנת: ${title}`,
          category: "CUSTOM",
          frequencyDays: Math.max(1, Math.round((hoursAhead || 24) / 24)),
          nextDueDate: scheduledDate,
          priority: "HIGH",
          isCompleted: false,
        },
      });

      // Update WaterLog recommendation step
      if (testId) {
        const waterLog = await prisma.waterLog.findFirst({
          where: { id: testId, userId: user.id },
        });

        if (waterLog && waterLog.aiRecommendations) {
          try {
            const rec = JSON.parse(waterLog.aiRecommendations);
            if (rec.stepByStepPlan) {
              rec.stepByStepPlan = rec.stepByStepPlan.map((s: any) => {
                if (s.stepNumber === stepNumber || s.title === title) {
                  return {
                    ...s,
                    isScheduled: true,
                    scheduledTaskId: task.id,
                    scheduledFor: scheduledDate.toISOString(),
                    isExecuted: false,
                  };
                }
                return s;
              });

              await prisma.waterLog.update({
                where: { id: waterLog.id },
                data: { aiRecommendations: JSON.stringify(rec) },
              });
            }
          } catch (e) {
            console.error("Error updating waterLog recommendations:", e);
          }
        }
      }

      const formattedDate = `${scheduledDate.toLocaleDateString("he-IL")} בשעה ${scheduledDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
      return NextResponse.json({
        success: true,
        task,
        isScheduled: true,
        scheduledFor: scheduledDate.toISOString(),
        message: `המשימה תוזמנה בהצלחה ללוח השנה ל-${formattedDate}!`,
      });
    }

    // === CASE 2: EXECUTE NOW OR COMPLETE SCHEDULED (סמן כבוצע ותעד ביומן) ===
    let parsedDeductAmount: number | null = null;
    if (amount) {
      const match = amount.match(/(\d+(\.\d+)?)/);
      if (match) {
        parsedDeductAmount = parseFloat(match[1]);
      }
    }

    let matchedChem = null;
    let inventoryDeducted = false;
    let remainingQuantity: string | null = null;

    if (chemical && !chemical.includes("ללא חומר") && !chemical.includes("שטיפת פילטר")) {
      if (inventoryItemId) {
        matchedChem = await prisma.chemicalInventory.findFirst({
          where: { id: inventoryItemId, userId: user.id },
        });
      } else {
        const allChems = await prisma.chemicalInventory.findMany({
          where: { userId: user.id },
        });
        matchedChem = allChems.find(
          (c) =>
            c.name.toLowerCase().includes(chemical.toLowerCase()) ||
            chemical.toLowerCase().includes(c.name.toLowerCase()) ||
            (chemical.includes("בסיסיות") && (c.category === "PH_PLUS" || c.name.includes("בסיסיות") || c.name.toLowerCase().includes("alka"))) ||
            (chemical.includes("קצף") && (c.category === "ANTI_FOAM" || c.name.includes("קצף") || c.name.toLowerCase().includes("foam"))) ||
            (chemical.includes("שוק") && (c.category === "SHOCK" || c.name.includes("שוק") || c.name.toLowerCase().includes("mps"))) ||
            (chemical.includes("כלור") && (c.category === "SANITIZER" || c.name.includes("כלור"))) ||
            (chemical.includes("מצליל") && (c.category === "CLARIFIER" || c.name.includes("מצליל"))) ||
            (chemical.includes("מתכות") && c.name.includes("מתכות"))
        );
      }
    }

    // Deduct from inventory if matched
    if (matchedChem && parsedDeductAmount && parsedDeductAmount > 0) {
      const newQty = Math.max(0, matchedChem.quantity - parsedDeductAmount);
      await prisma.chemicalInventory.update({
        where: { id: matchedChem.id },
        data: {
          quantity: newQty,
          lastUsedDate: new Date(),
          lastUsedAmount: parsedDeductAmount,
        },
      });
      inventoryDeducted = true;
      remainingQuantity = `${newQty} ${matchedChem.unit === "GRAMS" ? 'גר\'' : matchedChem.unit === "ML" ? 'מ"ל' : matchedChem.unit}`;
    }

    // Create Diary Entry
    const diaryTitle = `ביצוע המלצת טיפול: ${title}`;
    const diaryContent = `בוצע בהצלחה: הוספת ${chemical || ""} (${amount || "לפי הוראות"}). ${instructions || ""} ${notes ? `הערות: ${notes}` : ""}`;
    const chemicalSummary = chemical && !chemical.includes("ללא חומר") ? `${chemical}: ${amount || "בוצע"}` : null;

    const diaryEntry = await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        title: diaryTitle,
        content: diaryContent,
        chemicalsAdded: chemicalSummary,
        entryDate: new Date(),
        waterQualityRating: 5,
      },
    });

    // If step was attached to a scheduled task, mark task as done
    if (testId) {
      const waterLog = await prisma.waterLog.findFirst({
        where: { id: testId, userId: user.id },
      });

      if (waterLog && waterLog.aiRecommendations) {
        try {
          const rec = JSON.parse(waterLog.aiRecommendations);
          if (rec.stepByStepPlan) {
            let scheduledTaskId: string | null = null;
            rec.stepByStepPlan = rec.stepByStepPlan.map((s: any) => {
              if (s.stepNumber === stepNumber || s.title === title) {
                if (s.scheduledTaskId) scheduledTaskId = s.scheduledTaskId;
                return {
                  ...s,
                  isScheduled: false,
                  isExecuted: true,
                  executedAt: new Date().toISOString(),
                  executedDiaryId: diaryEntry.id,
                };
              }
              return s;
            });

            if (scheduledTaskId) {
              await prisma.maintenanceTask.updateMany({
                where: { id: scheduledTaskId, userId: user.id },
                data: { isCompleted: true, lastDoneDate: new Date() },
              });
            }

            await prisma.waterLog.update({
              where: { id: waterLog.id },
              data: {
                aiRecommendations: JSON.stringify(rec),
                actionsTaken: waterLog.actionsTaken
                  ? `${waterLog.actionsTaken}; ${title}`
                  : `בוצע: ${title} (${new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})`,
              },
            });
          }
        } catch (e) {
          console.error("Error updating waterLog recommendations:", e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      diaryEntry,
      inventoryDeducted,
      remainingQuantity,
      message: `הפעולה תועדה בהצלחה ביומן${inventoryDeducted ? ` והופחתה מהמלאי (נותרו: ${remainingQuantity})` : ""}!`,
    });
  } catch (error: any) {
    console.error("Execute recommendation error:", error);
    return NextResponse.json({ error: error.message || "שגיאה בביצוע ההמלצה" }, { status: 500 });
  }
}
