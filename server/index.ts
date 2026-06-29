import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// ─── CRASH GUARDS ────────────────────────────────────────────────────────────
// Node.js 20 exits with code 1 on unhandled promise rejections (e.g. a pg-pool
// DNS failure inside seedAdmin that escapes the try/catch chain). That kills the
// process AFTER server.listen() already succeeded, so Railway sees "Connection
// refused" on the health check and marks the deployment failed.
//
// These handlers prevent any stray rejection/exception from taking down the
// server. Errors are logged so they remain visible in the deploy logs.
process.on("unhandledRejection", (reason: unknown) => {
  console.error(
    "[WARN] Unhandled promise rejection (server keeps running):",
    reason
  );
});
process.on("uncaughtException", (err: Error) => {
  console.error(
    "[WARN] Uncaught exception (server keeps running):",
    err.message,
    err.stack
  );
});
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Serve uploaded images statically in both dev and prod
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Health check endpoints — available immediately before any async setup
// Covers both /health and /api/health for Railway and other platforms
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Bind the port FIRST so the healthcheck always gets a response,
// even if the async setup below (DB, sessions, routes) takes time or fails.
const port = parseInt(process.env.PORT || "5000", 10);
const server = createServer(app);

// Temporary catch-all during startup — replaced once Vite / static files are ready
let startupDone = false;
app.use((req, res, next) => {
  if (startupDone || req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return next();
  }
  res.status(200).set("Content-Type", "text/html").end(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Beagvs Global</title>` +
    `<style>body{margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}` +
    `.box{text-align:center;color:#94a3b8}.spin{width:48px;height:48px;border:4px solid #334155;border-top-color:#3b82f6;border-radius:50%;animation:s 0.8s linear infinite;margin:0 auto 20px}` +
    `@keyframes s{to{transform:rotate(360deg)}}</style></head>` +
    `<body><div class="box"><div class="spin"></div><p>Starting up…</p></div></body></html>`
  );
});

server.listen({ port, host: "0.0.0.0" }, () => {
  log(`serving on port ${port}`);
});

async function runAutoSeed() {
  // Skip entirely when DATABASE_URL is absent — any DB call would produce an
  // ECONNREFUSED rejection.  pg-pool's internal `.catch((err) => { throw err })`
  // re-throws the rejection on a new microtask tick, which escapes our outer
  // try/catch and (in Node.js 20) exits the process with code 1 — killing the
  // server AFTER the Railway health check already passed.
  if (!process.env.DATABASE_URL) {
    console.log("[startup-seed] DATABASE_URL not set — skipping auto-seed.");
    return;
  }
  try {
    const { seedAdmin } = await import("./seed-startup");
    await seedAdmin();
  } catch (err) {
    console.error("Auto-seed failed (non-fatal):", err);
  }
  try {
    const { seedBlogPosts } = await import("./seed-blog");
    const result = await seedBlogPosts();
    if (result.success) {
      if ((result as any).created > 0) {
        console.log(`[startup-seed] Blog posts seeded: ${(result as any).created} created, ${(result as any).skipped} skipped.`);
      } else {
        console.log(`[startup-seed] Blog posts already seeded, skipping.`);
      }
    } else {
      console.warn("[startup-seed] Blog seed skipped:", (result as any).message);
    }
  } catch (err) {
    console.error("Blog auto-seed failed (non-fatal):", err);
  }
}

(async () => {
  try {
    // Run DB migrations first (uses drizzle-orm — no drizzle-kit needed at runtime)
    const { runMigrations, runSafetySQL } = await import("./migrate");
    await runMigrations();
    // Always run the safety patch — idempotently adds any columns that may be
    // missing on existing Railway DBs where an older migration was already
    // recorded as applied (e.g. listings.metadata, code 42703 crash fix).
    await runSafetySQL();
  } catch (err) {
    console.error(
      "Migration failed — server will continue but DB may be missing tables:",
      err
    );
  }

  try {
    await registerRoutes(app, server);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Express error:", err);
    });

    // Explicitly check NODE_ENV — never rely on Express's app.get("env") default
    // because Railway does NOT set NODE_ENV automatically, which caused the server
    // to start Vite dev mode in production and crash via process.exit(1).
    const isProduction = process.env.NODE_ENV === "production"
      || !!process.env.RAILWAY_ENVIRONMENT
      || !!process.env.RAILWAY_SERVICE_ID;

    if (!isProduction) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    startupDone = true;
    log("Application fully initialised");

    // Run auto-seed after everything is ready (non-blocking)
    runAutoSeed().catch(() => {});
  } catch (err) {
    console.error("Fatal startup error — routes/DB failed to initialise:", err);
    // Do NOT exit — keep the server alive so Railway healthcheck still passes
    // and the error is visible in deploy logs
  }
})();
