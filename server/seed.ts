import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@beagvsglobal.com";
const ADMIN_USERNAME = "admin";
const ADMIN_DEFAULT_PASSWORD = "Admin@2025!";

async function seedAdmin() {
  console.log("Seeding admin user...");

  const passwordHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 12);

  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));
  if (existing.length > 0) {
    // Always update to ensure admin is active and credentials are correct
    await db.update(users).set({
      passwordHash,
      role: "ADMIN",
      accountType: "BOTH",
      mustChangePassword: false,
      firstName: "Super",
      lastName: "Admin",
      username: ADMIN_USERNAME,
    }).where(eq(users.email, ADMIN_EMAIL));
    console.log("✓ Admin user updated and verified active!");
  } else {
    await db.insert(users).values({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      firstName: "Super",
      lastName: "Admin",
      passwordHash,
      role: "ADMIN",
      accountType: "BOTH",
      mustChangePassword: false,
    });
    console.log("✓ Admin user created successfully!");
  }

  console.log("  Email:    " + ADMIN_EMAIL);
  console.log("  Password: " + ADMIN_DEFAULT_PASSWORD);
  console.log("  Status:   Always active (no forced password change)");
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
