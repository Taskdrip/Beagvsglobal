import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "\n[FATAL] DATABASE_URL is not set.\n" +
    "On Railway: go to your app service → Variables tab and add:\n" +
    "  DATABASE_URL = ${{Postgres.DATABASE_URL}}\n" +
    "This links your PostgreSQL service to this app.\n"
  );
  process.exit(1);
}

const sslEnabled =
  process.env.DATABASE_SSL === "true" ||
  (process.env.NODE_ENV === "production" &&
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("helium"));

export const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});

export const db = drizzle({ client: pool, schema });
