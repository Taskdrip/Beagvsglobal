import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@beagvsglobal.com";
const ADMIN_USERNAME = "admin";
const ADMIN_DEFAULT_PASSWORD = "Admin@2025!";

async function seedAdmin() {
  console.log("Seeding admin user...");

  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));
  if (existing.length > 0) {
    console.log("Admin user already exists. Skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 12);

  await db.insert(users).values({
    email: ADMIN_EMAIL,
    username: ADMIN_USERNAME,
    firstName: "Super",
    lastName: "Admin",
    passwordHash,
    role: "ADMIN",
    accountType: "BOTH",
    mustChangePassword: true,
  });

  console.log("✓ Admin user seeded successfully!");
  console.log("  Email:    " + ADMIN_EMAIL);
  console.log("  Username: " + ADMIN_USERNAME);
  console.log("  Password: " + ADMIN_DEFAULT_PASSWORD);
  console.log("  NOTE: Admin must change password on first login.");
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
