-- Idempotent migration: safe to run on both fresh and existing databases.
-- Uses IF NOT EXISTS / DO blocks so re-running never fails.

-- ── Enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE "public"."account_type" AS ENUM('BUYER', 'SELLER', 'BOTH'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."currency" AS ENUM('PI', 'USDT', 'USD', 'NGN', 'EUR', 'GBP', 'CAD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."document_type" AS ENUM('DRIVERS_LICENSE', 'INTERNATIONAL_PASSPORT', 'NATIONAL_ID', 'VOTER_ID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."escrow_status" AS ENUM('CREATED', 'FUNDED', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'RELEASED', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."follow_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."kyc_status" AS ENUM('NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."listing_type" AS ENUM('REAL_ESTATE', 'SHIPPING_SERVICE', 'PRODUCT', 'SERVICE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."network" AS ENUM('PI_MAINNET', 'TRON', 'TON', 'BNB', 'SOL', 'AVAX', 'BANK_TRANSFER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."notification_type" AS ENUM('FOLLOW_REQUEST', 'MESSAGE', 'ESCROW_UPDATE', 'REVIEW', 'KYC_STATUS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."shipment_status" AS ENUM('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."verification_type" AS ENUM('FACIAL', 'DOCUMENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "public"."wallet_type" AS ENUM('PI', 'USDT_TRON', 'USDT_TON', 'USDT_BNB', 'USDT_SOL', 'USDT_AVAX'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Core tables (no FK deps) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar PRIMARY KEY NOT NULL,
  "sess" jsonb NOT NULL,
  "expire" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "username" varchar,
  "password_hash" varchar,
  "whatsapp" varchar,
  "address" text,
  "location" varchar,
  "bio" text,
  "role" "user_role" DEFAULT 'USER',
  "account_type" "account_type" DEFAULT 'BUYER',
  "must_change_password" boolean DEFAULT false,
  "two_factor_secret" varchar,
  "two_factor_enabled" boolean DEFAULT false,
  "kyc_status" "kyc_status" DEFAULT 'NOT_STARTED',
  "kyc_submitted_at" timestamp,
  "kyc_approved_at" timestamp,
  "kyc_rejected_at" timestamp,
  "kyc_rejection_reason" text,
  "kyc_notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email"),
  CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE IF NOT EXISTS "platform_wallets" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" "wallet_type" NOT NULL,
  "address" varchar NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar NOT NULL,
  "type" varchar NOT NULL,
  "currency" varchar,
  "network" varchar,
  "details" jsonb NOT NULL,
  "is_active" boolean DEFAULT true,
  "instructions" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_support_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar,
  "guest_name" varchar,
  "guest_email" varchar,
  "status" varchar DEFAULT 'open',
  "escalated_at" timestamp,
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ── Tables that depend only on users ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wallets" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "type" "wallet_type" NOT NULL,
  "address" varchar NOT NULL,
  "label" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar NOT NULL,
  "value" jsonb NOT NULL,
  "description" text,
  "updated_by" varchar,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "type" "notification_type" NOT NULL,
  "data" jsonb,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "author_id" varchar NOT NULL,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "excerpt" text,
  "content_markdown" text NOT NULL,
  "cover_image_url" varchar,
  "published" boolean DEFAULT false,
  "meta_description" text,
  "focus_keyword" varchar,
  "tags" text[] DEFAULT '{}',
  "og_title" varchar,
  "og_description" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "kyc_verifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "verification_type" "verification_type" NOT NULL,
  "status" "kyc_status" DEFAULT 'PENDING',
  "submitted_at" timestamp DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" varchar,
  "rejection_reason" text,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "listings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "seller_id" varchar NOT NULL,
  "type" "listing_type" NOT NULL,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "description" text NOT NULL,
  "price_crypto" numeric(22, 4) NOT NULL,
  "currency" "currency" NOT NULL,
  "network" "network" NOT NULL,
  "images" text[] DEFAULT '{}',
  "location" varchar,
  "metadata" jsonb,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "ai_support_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" varchar NOT NULL,
  "role" varchar NOT NULL,
  "content" text NOT NULL,
  "sender_name" varchar,
  "created_at" timestamp DEFAULT now()
);

-- ── Tables that depend on listings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" varchar NOT NULL,
  "reviewer_id" varchar NOT NULL,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "escrows" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" varchar NOT NULL,
  "buyer_id" varchar NOT NULL,
  "seller_id" varchar NOT NULL,
  "amount" numeric(22, 4) NOT NULL,
  "currency" "currency" NOT NULL,
  "network" "network" NOT NULL,
  "status" "escrow_status" DEFAULT 'CREATED',
  "buyer_tx_hash" varchar,
  "seller_tx_hash" varchar,
  "admin_note" text,
  "platform_fee_pct" numeric(5, 2) DEFAULT '10.00',
  "platform_fee_amount" numeric(18, 8),
  "seller_net_amount" numeric(18, 8),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ── Tables that depend on escrows ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_threads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" varchar,
  "buyer_id" varchar NOT NULL,
  "seller_id" varchar NOT NULL,
  "escrow_id" varchar,
  "status" varchar DEFAULT 'active',
  "last_message_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "shipments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "escrow_id" varchar,
  "seller_id" varchar NOT NULL,
  "buyer_id" varchar NOT NULL,
  "tracking_number" varchar NOT NULL,
  "carrier" varchar NOT NULL,
  "carrier_url" varchar,
  "status" "shipment_status" DEFAULT 'PENDING',
  "service_type" varchar,
  "origin" varchar,
  "origin_country" varchar,
  "destination" varchar,
  "destination_country" varchar,
  "recipient_name" varchar,
  "recipient_phone" varchar,
  "weight_kg" numeric(10, 3),
  "dimensions" jsonb,
  "estimated_delivery" timestamp,
  "actual_delivery" timestamp,
  "special_instructions" text,
  "insurance_value" numeric(18, 2),
  "insurance_currency" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "shipments_tracking_number_unique" UNIQUE("tracking_number")
);

-- ── Tables that depend on chat_threads ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" varchar NOT NULL,
  "sender_id" varchar NOT NULL,
  "recipient_id" varchar NOT NULL,
  "content" text NOT NULL,
  "message_type" varchar DEFAULT 'text',
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- ── Tables that depend on kyc_verifications ───────────────────────────────
CREATE TABLE IF NOT EXISTS "kyc_documents" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "verification_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "document_type" "document_type" NOT NULL,
  "country" varchar NOT NULL,
  "document_number" varchar,
  "expiry_date" timestamp,
  "file_url" varchar NOT NULL,
  "file_name" varchar NOT NULL,
  "file_size" integer,
  "mime_type" varchar,
  "is_deleted" boolean DEFAULT false,
  "uploaded_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "facial_verifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "verification_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "image_url" varchar NOT NULL,
  "liveness_score" numeric(5, 4),
  "confidence_score" numeric(5, 4),
  "biometric_hash" varchar,
  "verification_data" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- ── Tables that depend on shipments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "follows" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "follower_id" varchar NOT NULL,
  "followee_id" varchar NOT NULL,
  "status" "follow_status" DEFAULT 'PENDING',
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "shipment_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "shipment_id" varchar NOT NULL,
  "status" "shipment_status" NOT NULL,
  "location" varchar,
  "country" varchar,
  "description" text NOT NULL,
  "event_timestamp" timestamp DEFAULT now(),
  "created_by" varchar,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- ── Idempotent column additions ───────────────────────────────────────────
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "video_url" varchar;

-- ── Idempotent column type upgrades ──────────────────────────────────────
DO $$ BEGIN ALTER TABLE "escrows" ALTER COLUMN "amount" SET DATA TYPE numeric(22, 4); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "listings" ALTER COLUMN "price_crypto" SET DATA TYPE numeric(22, 4); EXCEPTION WHEN others THEN NULL; END $$;

-- ── Index ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");

-- ── Foreign keys (all idempotent) ─────────────────────────────────────────
DO $$ BEGIN ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ai_support_sessions" ADD CONSTRAINT "ai_support_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ai_support_messages" ADD CONSTRAINT "ai_support_messages_session_id_ai_support_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_support_sessions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "escrows" ADD CONSTRAINT "escrows_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "escrows" ADD CONSTRAINT "escrows_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "escrows" ADD CONSTRAINT "escrows_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_id_users_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_escrow_id_escrows_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrows"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_verification_id_kyc_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."kyc_verifications"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "facial_verifications" ADD CONSTRAINT "facial_verifications_verification_id_kyc_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."kyc_verifications"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "facial_verifications" ADD CONSTRAINT "facial_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "shipments" ADD CONSTRAINT "shipments_escrow_id_escrows_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrows"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "shipments" ADD CONSTRAINT "shipments_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "shipments" ADD CONSTRAINT "shipments_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
