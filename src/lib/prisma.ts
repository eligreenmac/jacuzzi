import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let isSchemaEnsured = false;
export async function ensureDbSchema() {
  if (isSchemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifySameDayTasks" BOOLEAN DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyOverdueTasks" BOOLEAN DEFAULT true;
    `);
    isSchemaEnsured = true;
  } catch (e) {
    // If table doesn't exist yet or non-postgres, ignore
  }
}
