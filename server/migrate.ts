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

/**
 * Post-migration safety patch — runs on EVERY startup.
 *
 * All statements are fully idempotent (ADD COLUMN IF NOT EXISTS / DO blocks).
 * This guards against the common Railway scenario where drizzle records a
 * migration as "already applied" from an older deployment that was missing
 * certain columns (e.g. listings.metadata).  It costs milliseconds and is
 * completely safe to run repeatedly.
 */
export async function runSafetySQL(): Promise<void> {
  console.log("[migrate] Running post-migration schema safety checks...");

  // ── Phase 1: enum types (must exist before columns that reference them) ────
  // Run these in a single DO block so each is independent and idempotent.
  await pool.query(`
    DO $$
    BEGIN
      BEGIN
        CREATE TYPE "public"."listing_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END $$;
  `).catch((e: any) => {
    console.warn("[migrate] Enum safety warning:", e.message?.split("\n")[0]);
  });

  const statements: string[] = [
    // ── listings ──────────────────────────────────────────────────────────
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "metadata" jsonb`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT '{}'`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "location" varchar`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "video_url" varchar`,

    // Approval workflow columns — these require the listing_approval_status enum
    // which is created in Phase 1 above.
    `DO $$ BEGIN ALTER TABLE "listings" ADD COLUMN "approval_status" "listing_approval_status" DEFAULT 'PENDING'; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_object THEN NULL; END $$`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "approval_note" text`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "approved_at" timestamp`,
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "approved_by" varchar`,

    // ── users ──────────────────────────────────────────────────────────────
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" varchar`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" varchar`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_status" varchar DEFAULT 'NOT_STARTED'`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_submitted_at" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_approved_at" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_rejected_at" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_rejection_reason" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_notes" text`,

    // ── ai_support_sessions ────────────────────────────────────────────────
    `ALTER TABLE "ai_support_sessions" ADD COLUMN IF NOT EXISTS "escalated_at" timestamp`,
    `ALTER TABLE "ai_support_sessions" ADD COLUMN IF NOT EXISTS "closed_at" timestamp`,

    // ── blog_posts ─────────────────────────────────────────────────────────
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "meta_description" text`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "focus_keyword" varchar`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "og_title" varchar`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "og_description" text`,
    `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'`,

    // ── escrows ────────────────────────────────────────────────────────────
    `ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "admin_note" text`,
    `ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "platform_fee_pct" numeric(5,2) DEFAULT '10.00'`,
    `ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "platform_fee_amount" numeric(18,8)`,
    `ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "seller_net_amount" numeric(18,8)`,

    // ── shipments ──────────────────────────────────────────────────────────
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "carrier_url" varchar`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "service_type" varchar`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "origin_country" varchar`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "destination_country" varchar`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "recipient_name" varchar`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "recipient_phone" varchar`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "weight_kg" numeric(10,3)`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "dimensions" jsonb`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "special_instructions" text`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "insurance_value" numeric(18,2)`,
    `ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "insurance_currency" varchar`,

    // ── competitors (entire table — created via db:push, not in migration SQL) ─
    `CREATE TABLE IF NOT EXISTS "competitors" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar NOT NULL,
      "website" varchar,
      "country" varchar,
      "industry" varchar NOT NULL DEFAULT 'BOTH',
      "notes" text,
      "blog_url" varchar,
      "social_links" jsonb DEFAULT '{}',
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,

    // ── competitor_content ─────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS "competitor_content" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "competitor_id" varchar NOT NULL REFERENCES "competitors"("id") ON DELETE CASCADE,
      "type" varchar NOT NULL,
      "platform" varchar NOT NULL,
      "title" varchar,
      "summary" text,
      "url" varchar,
      "engagement_likes" integer DEFAULT 0,
      "engagement_shares" integer DEFAULT 0,
      "engagement_comments" integer DEFAULT 0,
      "published_at" timestamp,
      "tracked_at" timestamp DEFAULT now(),
      "created_at" timestamp DEFAULT now()
    )`,

    // ── index (safe) ───────────────────────────────────────────────────────
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire")`,
  ];

  let applied = 0;
  let warnings = 0;
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      applied++;
    } catch (err: any) {
      // Table may not exist yet (migration hasn't created it) — non-fatal
      const msg = (err?.message ?? "").split("\n")[0];
      if (!msg.includes("does not exist")) {
        console.warn(`[migrate] Safety SQL warning: ${msg}`);
      }
      warnings++;
    }
  }

  console.log(`[migrate] Schema safety checks complete — ${applied} statements ok, ${warnings} skipped.`);
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
