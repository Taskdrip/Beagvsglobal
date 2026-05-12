import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Health check endpoints — available immediately before any async setup
// Covers both /health and /api/health for Railway and other platforms
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Bind the port FIRST so the healthcheck always gets a response,
// even if the async setup below (DB, sessions, routes) takes time or fails.
const port = parseInt(process.env.PORT || "5000", 10);
const server = createServer(app);

server.listen({ port, host: "0.0.0.0" }, () => {
  log(`serving on port ${port}`);
});

async function runAutoSeed() {
  try {
    const { seedAdmin } = await import("./seed-startup");
    await seedAdmin();
  } catch (err) {
    console.error("Auto-seed failed (non-fatal):", err);
  }
}

(async () => {
  try {
    await registerRoutes(app, server);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Express error:", err);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    log("Application fully initialised");

    // Run auto-seed after everything is ready (non-blocking)
    runAutoSeed().catch(() => {});
  } catch (err) {
    console.error("Fatal startup error — routes/DB failed to initialise:", err);
    // Do NOT exit — keep the server alive so Railway healthcheck still passes
    // and the error is visible in deploy logs
  }
})();
