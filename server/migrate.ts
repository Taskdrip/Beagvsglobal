import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import fs from "fs";
import { db, pool } from "./db";

export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), "migrations");
  console.log(`[migrate] Applying migrations from: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("[migrate] All migrations applied successfully.");
    return;
  } catch (err: any) {
    console.error("[migrate] Drizzle migrator failed, trying raw SQL fallback:", err?.message ?? err);
  }

  try {
    if (!fs.existsSync(migrationsFolder)) {
      console.error(`[migrate] Migrations folder not found: ${migrationsFolder}`);
      throw new Error(`Migrations folder not found: ${migrationsFolder}`);
    }
    const sqlFiles = fs.readdirSync(migrationsFolder)
      .filter((f: string) => f.endsWith(".sql"))
      .sort();

    for (const file of sqlFiles) {
      const sql = fs.readFileSync(path.join(migrationsFolder, file), "utf-8");
      await pool.query(sql);
      console.log(`[migrate] Applied raw SQL: ${file}`);
    }
    console.log("[migrate] Raw SQL migrations applied successfully.");
  } catch (rawErr: any) {
    console.error("[migrate] Raw SQL migration also failed:", rawErr?.message ?? rawErr);
    throw rawErr;
  }
}

if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
