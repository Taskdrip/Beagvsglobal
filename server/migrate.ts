import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { db, pool } from "./db";

export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), "migrations");
  console.log(`[migrate] Applying migrations from: ${migrationsFolder}`);
  try {
    await migrate(db, { migrationsFolder });
    console.log("[migrate] All migrations applied successfully.");
  } catch (err: any) {
    console.error("[migrate] Migration error:", err?.message ?? err);
    throw err;
  }
}

// Allow running directly: node dist/migrate.js
if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
