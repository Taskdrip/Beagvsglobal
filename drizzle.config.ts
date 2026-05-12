import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const url = process.env.DATABASE_URL;
const isExternal =
  url &&
  !url.includes("localhost") &&
  !url.includes("127.0.0.1") &&
  !url.includes("helium");

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: process.env.DATABASE_SSL === "true" || (process.env.NODE_ENV === "production" && isExternal)
      ? { rejectUnauthorized: false }
      : undefined,
  },
});
