-- Add receipt_url to payout requests so admin can attach a payment receipt
ALTER TABLE "seller_payout_requests" ADD COLUMN IF NOT EXISTS "receipt_url" varchar;
