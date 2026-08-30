import { execSync } from "child_process";

const dbUrl = process.env.DATABASE_URL || "";
if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
  console.log("Syncing database schema with Neon PostgreSQL (prisma db push)...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("Database schema synced successfully!");
  } catch (err) {
    console.warn("Prisma db push warning:", err.message);
  }
} else {
  console.log("Skipping prisma db push (local or non-postgres database url).");
}
