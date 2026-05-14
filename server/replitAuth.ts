import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { pool } from "./db";

const IS_REPLIT = !!process.env.REPLIT_DOMAINS;

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;

  // ⚠️  Use PostgreSQL session store only when DATABASE_URL is available.
  // If DATABASE_URL is missing, connect-pg-simple immediately queries the pool
  // to create the sessions table. When the DB is unreachable this emits an
  // unhandled error event that crashes the entire process — AFTER the Railway
  // health check has already passed, producing "Application failed to respond".
  // memorystore is a safe in-memory fallback; sessions won't survive restarts
  // but the app stays alive until DATABASE_URL is properly configured.
  let store: session.Store;

  if (process.env.DATABASE_URL) {
    const PgStore = connectPg(session);
    const pgStore = new PgStore({
      pool,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    // Prevent store-level errors from becoming unhandled exceptions
    (pgStore as any).on?.("error", (err: Error) => {
      console.error("[session-store] PG store error (non-fatal):", err.message);
    });
    store = pgStore;
    console.log("[session-store] Using PostgreSQL session store.");
  } else {
    const MemStore = MemoryStore(session);
    store = new MemStore({ checkPeriod: sessionTtl });
    console.warn(
      "[session-store] DATABASE_URL not set — using in-memory session store. " +
      "Sessions will not persist across restarts. " +
      "Set DATABASE_URL in Railway Variables to enable persistent sessions."
    );
  }

  const secret = process.env.SESSION_SECRET ?? (() => {
    const fallback = randomBytes(64).toString("hex");
    console.warn(
      "[auth] WARNING: SESSION_SECRET is not set. Using an ephemeral secret — " +
      "sessions will not survive restarts. Set SESSION_SECRET in your environment variables."
    );
    return fallback;
  })();

  return session({
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (!IS_REPLIT) {
    console.log("[auth] REPLIT_DOMAINS not set — Replit OIDC disabled. Using custom auth only.");
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!IS_REPLIT) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
