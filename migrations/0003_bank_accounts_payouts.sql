-- Add agent fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "agent_type" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_name" varchar;
--> statement-breakpoint

-- Bank accounts for user payouts
CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bank_name" varchar NOT NULL,
  "account_name" varchar NOT NULL,
  "account_number" varchar NOT NULL,
  "routing_number" varchar,
  "swift_code" varchar,
  "bank_address" text,
  "currency" varchar DEFAULT 'NGN',
  "country" varchar DEFAULT 'Nigeria',
  "is_default" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Payout status enum
DO $$ BEGIN
  CREATE TYPE "public"."payout_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- Seller payout requests
CREATE TABLE IF NOT EXISTS "seller_payout_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "escrow_id" varchar NOT NULL REFERENCES "escrows"("id") ON DELETE CASCADE,
  "seller_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" decimal(22,4) NOT NULL,
  "currency" varchar NOT NULL,
  "status" payout_status DEFAULT 'PENDING',
  "payment_method" varchar,
  "wallet_id" varchar REFERENCES "wallets"("id") ON DELETE SET NULL,
  "bank_account_id" varchar REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
  "notes" text,
  "admin_note" text,
  "reviewed_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" timestamp,
  "paid_at" timestamp,
  "tx_hash" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
