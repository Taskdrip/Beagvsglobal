// Create an admin user for testing
import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";

export async function createAdminUser() {
  console.log("Creating admin user...");
  
  try {
    const adminUser = {
      id: "admin-user-1",
      email: "admin@beagvs.com",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN" as const,
      accountType: "BOTH" as const,
      profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    };
    
    await db.insert(users).values(adminUser).onConflictDoUpdate({
      target: users.id,
      set: {
        role: "ADMIN",
        accountType: "BOTH",
        updatedAt: new Date()
      }
    });
    console.log("Admin user created successfully!");
    console.log("Admin credentials:");
    console.log("Email: admin@beagvs.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Run the creation
createAdminUser().then(() => process.exit(0)).catch(console.error);