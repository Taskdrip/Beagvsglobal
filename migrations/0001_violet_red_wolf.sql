-- Idempotent migration: all enum/type operations wrapped in exception-safe DO blocks
-- so this file can be re-run against databases that already have some of these objects.

DO $$ BEGIN
  CREATE TYPE "public"."listing_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."shipping_option" AS ENUM('SELF_PICKUP', 'BEAGVS_WITHIN_STATE', 'BEAGVS_OUT_OF_STATE_NIGERIA', 'BEAGVS_INTERNATIONAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."escrow_status" ADD VALUE 'PAYMENT_SUBMITTED' BEFORE 'FUNDED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "competitor_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competitor_id" varchar NOT NULL,
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
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "competitors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"website" varchar,
	"country" varchar,
	"industry" varchar DEFAULT 'BOTH' NOT NULL,
	"notes" text,
	"blog_url" varchar,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shipping_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"currency" varchar DEFAULT 'NGN' NOT NULL,
	"estimated_days" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "shipping_rates_option_unique" UNIQUE("option")
);
--> statement-breakpoint

ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "payment_receipt_url" varchar;
--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "payment_notes" text;
--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "payment_submitted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "admin_reviewed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "admin_reviewed_by" varchar;
--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "video_url" varchar;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "listings" ADD COLUMN "approval_status" "listing_approval_status" DEFAULT 'PENDING';
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_object THEN NULL;
END $$;
--> statement-breakpoint

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "approval_note" text;
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "approved_by" varchar;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "competitor_content" ADD CONSTRAINT "competitor_content_competitor_id_competitors_id_fk"
    FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
