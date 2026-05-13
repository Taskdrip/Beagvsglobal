import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Compatible with both Node.js 18 and Node.js 20+
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

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
    server: serverOptions,
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

      // always reload the index.html file from disk incase it changes
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
  // __dirname resolves to dist/ when running from dist/index.js
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // Log clearly but do NOT throw — keep the server alive so health check passes.
    // This can happen if the build step was skipped. Requests will get 404 for
    // static assets but the API and health check will still work.
    console.error(
      `[static] WARNING: Build directory not found at ${distPath}. ` +
      `Run "npm run build" to generate client assets. API routes still work.`
    );
    // Serve a minimal fallback so users see something instead of a blank page
    app.use("*", (_req, res) => {
      res.status(503).send(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px">` +
        `<h2>App is starting…</h2><p>Please refresh in a moment.</p></body></html>`
      );
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
