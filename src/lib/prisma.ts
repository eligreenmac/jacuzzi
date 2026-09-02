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

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || "";
      const isConnectionError =
        msg.includes("Can't reach database server") ||
        msg.includes("P1001") ||
        msg.includes("Connection terminated") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("pooler");

      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`[Neon DB Wakeup] Connection attempt ${i + 1} failed. Retrying in ${delayMs * (i + 1)}ms...`);
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

let isSchemaEnsured = false;
export async function ensureDbSchema() {
  if (isSchemaEnsured) return;
  try {
    await withRetry(async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifySameDayTasks" BOOLEAN DEFAULT true;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyOverdueTasks" BOOLEAN DEFAULT true;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Jacuzzi" ADD COLUMN IF NOT EXISTS "testStripParams" TEXT DEFAULT '["ph","chlorine","alkalinity","clarity"]';
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "calcium" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "calciumRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "totalChlorine" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "totalChlorineRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "cya" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "cyaRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "salt" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "saltRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "waterTemp" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "waterTempRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "testedParams" TEXT;
      `);
    });
    isSchemaEnsured = true;
  } catch (e) {
    // If table doesn't exist yet or non-postgres, ignore
  }
}
