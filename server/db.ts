import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "\n[ERROR] DATABASE_URL is not set.\n" +
    "On Railway: open your Beagvsglobal service → Variables tab → add:\n" +
    "  DATABASE_URL = ${{Postgres.DATABASE_URL}}\n" +
    "The server will stay alive but all database operations will fail.\n"
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
  connectionString: connectionString || "postgresql://invalid-host/placeholder",
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  // Short timeouts so a bad connection fails fast and stops retrying
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  // Limit pool size to reduce noise from connection errors
  max: connectionString ? 10 : 1,
});

// ⚠️  CRITICAL: without this handler, any pool-level error (e.g. ECONNREFUSED
// on an idle client's keepalive) becomes an uncaught exception that kills the
// entire Node.js process and triggers Railway's "Crashed" status.
pool.on("error", (err: Error) => {
  console.error("[db] Pool idle-client error (non-fatal):", err.message);
});

export const db = drizzle({ client: pool, schema });
