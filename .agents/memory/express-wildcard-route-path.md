---
name: Express req.path inside app.use("*", ...) is always "/"
description: Why URL-based logic (e.g. per-route SSR/meta injection) silently no-ops when placed in an Express wildcard catch-all middleware.
---

Inside `app.use("*", handler)`, Express sets `req.path` relative to the mount point, which for a `"*"` mount is always `"/"` — regardless of the actual requested URL. Any logic that branches on `req.path` (e.g. matching `/blog/:slug` to inject page-specific SSR/meta tags into the SPA's `index.html`) will never match and will silently fall through to the default/generic branch, with no error thrown.

**Why:** Discovered while adding server-side Open Graph meta tag injection for blog post pages (for social share previews) into the Vite dev catch-all and prod static catch-all in `server/vite.ts` — the injection function worked perfectly in isolation but never fired through the real HTTP path until this was found via added debug logging.

**How to apply:** Inside any `app.use("*", ...)` or other wildcard-mounted middleware, use `req.originalUrl` (not `req.path` or `req.url`) to get the true requested path.
