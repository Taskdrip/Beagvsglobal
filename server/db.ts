import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Log clearly but do NOT exit — let the HTTP server stay alive so
  // Railway's healthcheck passes and the error is visible in deploy logs.
  console.error(
    "\n[ERROR] DATABASE_URL is not set.\n" +
    "On Railway: Beagvsglobal service → Variables tab → add:\n" +
    "  DATABASE_URL = ${{Postgres.DATABASE_URL}}\n" +
    "The server will start but all database operations will fail.\n"
  );
}

const sslEnabled =
  process.env.DATABASE_SSL === "true" ||
  (process.env.NODE_ENV === "production" &&
    !!connectionString &&
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("helium"));

export const pool = new Pool({
  connectionString: connectionString || "postgresql://localhost/placeholder",
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});

export const db = drizzle({ client: pool, schema });
