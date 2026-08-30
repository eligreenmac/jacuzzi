import { prisma } from "@/lib/prisma";

/**
 * Checks if a chemical inventory item is low (below 1/3 or below threshold)
 * and automatically creates a high-priority "להזמין: [שם החומר]" task scheduled for today
 * if one does not already exist.
 */
export async function checkAndCreateLowStockTask(
  userId: string,
  chemical: { id: string; name: string; quantity: number; unit: string; minThreshold?: number | null }
) {
  // Threshold: below 1/3 of standard pack (333g / 333ml / 15-20 tablets/strips) or custom minThreshold
  const defaultThreshold = chemical.unit === "GRAMS" || chemical.unit === "ML" ? 330 : 15;
  const effectiveThreshold = chemical.minThreshold && chemical.minThreshold > 0 ? chemical.minThreshold : defaultThreshold;
  
  const isLowStock = chemical.quantity <= effectiveThreshold;

  if (isLowStock) {
    const taskTitle = `להזמין: ${chemical.name}`;

    // Prevent duplicate open tasks for the same chemical
    const existingTask = await prisma.maintenanceTask.findFirst({
      where: {
        userId,
        title: taskTitle,
        isCompleted: false,
      },
    });

    if (!existingTask) {
      const today = new Date();
      const unitLabel =
        chemical.unit === "GRAMS"
          ? 'גר\''
          : chemical.unit === "ML"
          ? 'מ"ל'
          : chemical.unit === "TABLETS"
          ? "טבליות"
          : chemical.unit === "STRIPS"
          ? "מקלונים"
          : "יחידות";

      await prisma.maintenanceTask.create({
        data: {
          userId,
          title: taskTitle,
          description: `המלאי בארון ירד מתחת לשליש (נותרו כ-${chemical.quantity} ${unitLabel}). שובצה משימה להיום להזמנת החומר כדי למנוע מחסור בטיפולים הבאים.`,
          category: "CUSTOM",
          frequencyDays: 1,
          nextDueDate: today,
          priority: "HIGH",
          isCompleted: false,
        },
      });

      // Also record a diary alert note
      await prisma.diaryEntry.create({
        data: {
          userId,
          title: `התראת מלאי נמוך: ${chemical.name}`,
          content: `המלאי של ${chemical.name} ירד מתחת לשליש (נותרו ${chemical.quantity} ${unitLabel}). שובצה משימת רכש להיום בלוח השנה.`,
          entryDate: today,
          waterQualityRating: 4,
        },
      });
    }
  } else {
    // If chemical was restocked above threshold, auto-resolve any pending "להזמין" task!
    const taskTitle = `להזמין: ${chemical.name}`;
    await prisma.maintenanceTask.deleteMany({
      where: {
        userId,
        title: taskTitle,
        isCompleted: false,
      },
    });
  }
}

/**
 * Scan all user chemicals and ensure low stock tasks exist for any chemical below 1/3
 */
export async function scanAndEnsureLowStockTasks(userId: string) {
  const chemicals = await prisma.chemicalInventory.findMany({
    where: { userId },
  });

  for (const chem of chemicals) {
    await checkAndCreateLowStockTask(userId, chem);
  }
}
