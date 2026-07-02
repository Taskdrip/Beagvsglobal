-- Add DELIVERY_AGENT role to user_role enum (idempotent)
DO $$ BEGIN
  ALTER TYPE "public"."user_role" ADD VALUE 'DELIVERY_AGENT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- Add agent_id column to shipments (idempotent)
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "agent_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;
