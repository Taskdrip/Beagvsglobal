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

// Only create a real pool when we have a valid connection string.
// Using a bad fallback URL (e.g. "localhost/placeholder") causes pg to emit
// unhandled 'error' events on idle reconnect attempts that crash the process.
const _pool = connectionString
  ? new Pool({
      connectionString,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

// ⚠️  CRITICAL: without this handler, any pool-level error (e.g. ECONNREFUSED
// on an idle client's keepalive) becomes an uncaught exception that kills the
// entire Node.js process and triggers Railway's "Crashed" status.
if (_pool) {
  _pool.on("error", (err: Error) => {
    console.error("[db] Pool idle-client error (non-fatal):", err.message);
  });
}

// Provide a safe shim so all imports of `pool` get a usable object —
// queries will fail clearly rather than crashing on a null reference.
export const pool: pg.Pool = _pool ?? ({
  query: () => Promise.reject(new Error("[db] DATABASE_URL is not configured — set it in Railway Variables")),
  connect: () => Promise.reject(new Error("[db] DATABASE_URL is not configured — set it in Railway Variables")),
  end: () => Promise.resolve(),
  on: () => {},
  off: () => {},
} as unknown as pg.Pool);

export const db = drizzle({ client: pool, schema });
