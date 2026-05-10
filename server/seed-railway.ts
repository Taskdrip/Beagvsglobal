/**
 * Railway Seed Script
 * Run once after deploying to Railway to create the admin user and essential data.
 *
 * Usage (on Railway):
 *   npx tsx server/seed-railway.ts
 *
 * Or locally against your Railway DB:
 *   DATABASE_URL="postgresql://..." SESSION_SECRET="anything" npx tsx server/seed-railway.ts
 */

import { db } from "./db";
import { users, paymentMethods } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@beagvsglobal.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@2025!";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "beagvsadmin";

async function seed() {
  console.log("🌱 Starting Railway seed...\n");

  // ── 1. Admin user ──────────────────────────────────────────────────────────
  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));

  if (existing.length > 0) {
    console.log(`✓ Admin user already exists (${ADMIN_EMAIL}) — skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.insert(users).values({
      id: `admin-${Date.now()}`,
      email: ADMIN_EMAIL,
      firstName: "Admin",
      lastName: "Beagvs",
      username: ADMIN_USERNAME,
      passwordHash,
      role: "ADMIN",
      accountType: "BOTH",
      mustChangePassword: true,
    });
    console.log(`✓ Admin user created`);
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  ⚠  Change the password on first login!\n`);
  }

  // ── 2. Default payment methods ─────────────────────────────────────────────
  const existingMethods = await db.select().from(paymentMethods);

  if (existingMethods.length > 0) {
    console.log(`✓ Payment methods already exist (${existingMethods.length}) — skipping.`);
  } else {
    await db.insert(paymentMethods).values([
      {
        name: "Pi Network",
        type: "crypto",
        currency: "PI",
        network: "PI_MAINNET",
        details: { walletAddress: "YOUR_PI_WALLET_ADDRESS" },
        isActive: true,
        instructions: "Send PI to the wallet address above and paste your transaction hash.",
      },
      {
        name: "USDT (TRON / TRC-20)",
        type: "crypto",
        currency: "USDT",
        network: "TRON",
        details: { walletAddress: "YOUR_TRON_USDT_WALLET" },
        isActive: true,
        instructions: "Send USDT TRC-20 to the address above and paste your transaction hash.",
      },
      {
        name: "USDT (BNB / BEP-20)",
        type: "crypto",
        currency: "USDT",
        network: "BNB",
        details: { walletAddress: "YOUR_BNB_USDT_WALLET" },
        isActive: true,
        instructions: "Send USDT BEP-20 to the address above and paste your transaction hash.",
      },
      {
        name: "Bank Transfer (USD)",
        type: "bank",
        currency: "USD",
        network: "BANK_TRANSFER",
        details: {
          bankName: "Your Bank Name",
          accountName: "Beagvs Global Ltd",
          accountNumber: "XXXX-XXXX",
          routingNumber: "XXXXXXXXX",
        },
        isActive: true,
        instructions: "Transfer USD to the bank account above and email us proof of payment.",
      },
    ]);
    console.log(`✓ Default payment methods seeded`);
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
