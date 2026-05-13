import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

// Compatible with both Node.js 18 and Node.js 20+
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ⚠️  ALL vite imports are dynamic and live INSIDE this function.
// This is intentional: in production this function is never called, so vite
// (a devDependency that Railway prunes after build) is never imported.
// Top-level static imports of vite would crash the process before health-check
// routes even register, causing "Application failed to respond" on Railway.
export async function setupVite(app: Express, server: Server) {
  // Dynamic imports — resolved only in development where devDeps are present
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await import("../vite.config");

  const viteLogger = createLogger();

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      // Never call process.exit — a Vite error should not crash the whole server
      error: (msg, options) => {
        viteLogger.error(msg, options);
        console.error("[vite] Error in dev server (non-fatal):", msg);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // __dirname resolves to dist/ when running from dist/index.js after build
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // Log clearly but do NOT throw — keep the server alive so health check passes.
    // This can happen if the build step was skipped. API routes still work.
    console.error(
      `[static] WARNING: Build directory not found at ${distPath}. ` +
        `Run "npm run build" to generate client assets. API routes still work.`,
    );
    app.use("*", (_req, res) => {
      res.status(503).send(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px">` +
          `<h2>App is starting…</h2><p>Please refresh in a moment.</p></body></html>`,
      );
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html for client-side routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
