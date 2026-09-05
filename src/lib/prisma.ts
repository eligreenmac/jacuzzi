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
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyOverdueTasks" BOOLEAN DEFAULT true;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days';
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'TRIAL';
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lemonSqueezyCustomerId" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lemonSqueezySubscriptionId" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP WITH TIME ZONE;
        UPDATE "User" SET "subscriptionStatus" = 'ADMIN' WHERE LOWER(TRIM("email")) = 'eligreenmail@gmail.com';
        UPDATE "User" 
        SET "trialEndsAt" = "createdAt" + INTERVAL '14 days'
        WHERE "subscriptionStatus" != 'ACTIVE' 
          AND "subscriptionStatus" != 'ADMIN' 
          AND ("trialEndsAt" <= "createdAt" + INTERVAL '1 hour' OR "trialEndsAt" IS NULL);
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Jacuzzi" ADD COLUMN IF NOT EXISTS "testStripParams" TEXT DEFAULT '["ph","chlorine","alkalinity"]';
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
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "carbonate" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "carbonateRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "bromine" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "bromineRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "nitrate" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "nitrateRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "nitrite" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "nitriteRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "iron" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "ironRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "copper" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "copperRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "chromium" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "chromiumRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "lead" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "leadRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "mercury" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "mercuryRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "fluoride" DOUBLE PRECISION;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "fluorideRange" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "extendedMetrics" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "testedParams" TEXT;
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "waterOdor" TEXT DEFAULT 'FRESH';
        ALTER TABLE "WaterLog" ADD COLUMN IF NOT EXISTS "clarityOdorNotes" TEXT;
      `);
    });
    isSchemaEnsured = true;
  } catch (e) {
    // If table doesn't exist yet or non-postgres, ignore
  }
}
