import type { Express } from "express";
import { createServer, type Server } from "http";
import type { Server as HttpServer } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertListingSchema, insertEscrowSchema, insertReviewSchema, insertWalletSchema, insertFollowSchema, insertChatThreadSchema, insertMessageSchema, insertBlogPostSchema, insertPlatformWalletSchema, insertPaymentMethodSchema, insertKycVerificationSchema, insertKycDocumentSchema, insertFacialVerificationSchema, insertShipmentSchema, insertShipmentEventSchema, insertPlatformSettingSchema, insertCompetitorSchema, insertCompetitorContentSchema } from "@shared/schema";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { saveImage, serveStoredImage } from "./imageStorage";
import { getPiUser, approvePiPayment, completePiPayment, cancelPiPayment, getPiPayment } from "./pi";

export async function registerRoutes(app: Express, existingServer?: HttpServer): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Custom auth routes (email/password)
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, username, accountType } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if username is taken
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        username,
        passwordHash,
        accountType: accountType || 'BUYER',
        role: 'USER'
      });

      // Create session with explicit save
      const { passwordHash: _, ...publicUser } = user;
      await new Promise<void>((resolve) => {
        (req as any).session.regenerate((regenErr: any) => {
          if (regenErr) {
            console.error('[signup] session.regenerate error (non-fatal):', regenErr);
            return resolve();
          }
          (req as any).session.userId = user.id;
          (req as any).session.isCustomAuth = true;
          (req as any).session.save((saveErr: any) => {
            if (saveErr) console.error('[signup] session.save error (non-fatal):', saveErr);
            resolve();
          });
        });
      });

      res.status(201).json(publicUser);
    } catch (error: any) {
      console.error("Signup error:", error);
      const msg: string = error?.message || '';
      if (msg.includes('unique') || msg.includes('duplicate') || (error as any)?.code === '23505') {
        if (msg.includes('email')) return res.status(400).json({ message: 'An account with this email already exists' });
        if (msg.includes('username')) return res.status(400).json({ message: 'Username is already taken' });
        return res.status(400).json({ message: 'Account already exists with this email or username' });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { passwordHash: _, ...publicUser } = user;

      // Regenerate session to prevent session fixation, then save explicitly
      await new Promise<void>((resolve) => {
        (req as any).session.regenerate((regenErr: any) => {
          if (regenErr) {
            console.error('[login] session.regenerate error (non-fatal):', regenErr);
            return resolve();
          }
          (req as any).session.userId = user.id;
          (req as any).session.isCustomAuth = true;
          (req as any).session.save((saveErr: any) => {
            if (saveErr) console.error('[login] session.save error (non-fatal):', saveErr);
            resolve();
          });
        });
      });

      res.json(publicUser);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Change password route
  app.post('/api/auth/change-password', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) return res.status(401).json({ message: "User not found" });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      const newHash = await bcrypt.hash(newPassword, 10);
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users).set({ passwordHash: newHash, mustChangePassword: false }).where(eq(users.id, userId));
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Admin change password (from admin panel)
  app.post('/api/admin/change-password', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'ADMIN') return res.status(403).json({ message: "Admin only" });
      const { currentPassword, newPassword } = req.body;
      if (!user.passwordHash) return res.status(400).json({ message: "No password set" });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      const newHash = await bcrypt.hash(newPassword, 10);
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users).set({ passwordHash: newHash, mustChangePassword: false }).where(eq(users.id, userId));
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Admin change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // 2FA Routes
  app.post('/api/auth/2fa/setup', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const secret = speakeasy.generateSecret({
        name: `Beagvs Marine (${user.email || user.username})`,
        length: 20,
      });

      // Save the temp secret (not enabled yet until verified)
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users).set({ twoFactorSecret: secret.base32 }).where(eq(users.id, userId));

      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
      res.json({ secret: secret.base32, qrCode });
    } catch (error: any) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.post('/api/auth/2fa/enable', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { token } = req.body;
      const user = await storage.getUser(userId);
      if (!user || !user.twoFactorSecret) return res.status(400).json({ message: "2FA not set up" });

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2,
      });
      if (!verified) return res.status(400).json({ message: "Invalid verification code" });

      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, userId));
      res.json({ message: "2FA enabled successfully" });
    } catch (error: any) {
      console.error("2FA enable error:", error);
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  app.post('/api/auth/2fa/disable', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { token, password } = req.body;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Require password confirmation to disable 2FA
      if (user.passwordHash) {
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ message: "Incorrect password" });
      }

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token,
          window: 2,
        });
        if (!verified) return res.status(400).json({ message: "Invalid 2FA code" });
      }

      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null }).where(eq(users.id, userId));
      res.json({ message: "2FA disabled successfully" });
    } catch (error: any) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  app.get('/api/auth/2fa/status', async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ enabled: !!user.twoFactorEnabled, hasSecret: !!user.twoFactorSecret });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get 2FA status" });
    }
  });

  // Enhanced auth middleware that handles both Replit auth and custom auth
  const isAuthenticatedEnhanced = async (req: any, res: any, next: any) => {
    // Check for custom auth session first
    if (req.session?.userId && req.session?.isCustomAuth) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          req.user = { claims: { sub: user.id }, customAuth: true };
          return next();
        }
      } catch (error) {
        console.error("Session user lookup error:", error);
      }
    }
    
    // Fall back to Replit auth
    return isAuthenticated(req, res, next);
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { passwordHash: _, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User registration (for non-Replit auth flow)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email!);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username!);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ message: "User created successfully", userId: user.id });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // (duplicate login route removed)

  // ---------------------------------------------------------------------
  // Pi Network authentication & payments
  // ---------------------------------------------------------------------

  // Verify a Pi SDK access token, then find-or-create a Beagvs user linked
  // to that Pi account and log them in via session (same pattern as email/password login).
  app.post('/api/auth/pi', async (req, res) => {
    try {
      const { accessToken, username } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: "Missing Pi access token" });
      }

      const piUser = await getPiUser(accessToken);

      let user = await storage.getUserByPiUid(piUser.uid);
      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        user = await storage.createUser({
          piUid: piUser.uid,
          piUsername: piUser.username || username,
          username: `pi_${piUser.username || piUser.uid}`.slice(0, 50),
          // New Pi users haven't gone through the account-type picker that the
          // regular signup form uses, so mark them for onboarding on the client
          // instead of assuming an account type for them.
          accountType: 'BUYER',
          role: 'USER',
        });
      } else if (piUser.username && piUser.username !== user.piUsername) {
        user = await storage.updateUser(user.id, { piUsername: piUser.username });
      }

      const { passwordHash: _, ...publicUser } = user;
      (publicUser as any).isNewUser = isNewUser;

      await new Promise<void>((resolve) => {
        (req as any).session.regenerate((regenErr: any) => {
          if (regenErr) {
            console.error('[pi-login] session.regenerate error (non-fatal):', regenErr);
            return resolve();
          }
          (req as any).session.userId = user!.id;
          (req as any).session.isCustomAuth = true;
          (req as any).session.save((saveErr: any) => {
            if (saveErr) console.error('[pi-login] session.save error (non-fatal):', saveErr);
            resolve();
          });
        });
      });

      res.json(publicUser);
    } catch (error: any) {
      console.error("Pi auth error:", error);
      res.status(401).json({ message: error.message || "Pi authentication failed" });
    }
  });

  // Called from the client's onReadyForServerApproval callback.
  // Approves the Pi payment on the Pi Platform so the user can confirm it in their wallet.
  app.post('/api/pi/approve', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { paymentId, escrowId } = req.body;
      if (!paymentId || !escrowId) {
        return res.status(400).json({ message: "paymentId and escrowId are required" });
      }

      const escrow = await storage.getEscrow(escrowId);
      if (!escrow || escrow.buyerId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized for this escrow" });
      }

      await approvePiPayment(paymentId);
      await storage.updateEscrow(escrowId, { piPaymentId: paymentId } as any);

      res.json({ status: "approved" });
    } catch (error: any) {
      console.error("Pi payment approval error:", error);
      res.status(500).json({ message: error.message || "Failed to approve Pi payment" });
    }
  });

  // Called from the client's onReadyForServerCompletion callback once the user
  // has approved and blockchain-submitted the payment (txid available).
  app.post('/api/pi/complete', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { paymentId, txid, escrowId } = req.body;
      if (!paymentId || !txid || !escrowId) {
        return res.status(400).json({ message: "paymentId, txid and escrowId are required" });
      }

      const escrow = await storage.getEscrow(escrowId);
      if (!escrow || escrow.buyerId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized for this escrow" });
      }

      await completePiPayment(paymentId, txid);

      // A completed Pi payment is verified on the blockchain by the Pi Platform,
      // so we move the escrow straight to FUNDED (skipping manual admin review).
      const updated = await storage.updateEscrow(escrowId, {
        piPaymentId: paymentId,
        piTxid: txid,
        buyerTxHash: txid,
        status: 'FUNDED',
        paymentSubmittedAt: new Date(),
      } as any);

      res.json(updated);
    } catch (error: any) {
      console.error("Pi payment completion error:", error);
      res.status(500).json({ message: error.message || "Failed to complete Pi payment" });
    }
  });

  // Called from the client's onCancel / onError callbacks so we can clean up server state.
  app.post('/api/pi/cancel', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { paymentId } = req.body;
      if (paymentId) {
        try { await cancelPiPayment(paymentId); } catch { /* payment may not exist server-side yet */ }
      }
      res.json({ status: "cancelled" });
    } catch (error: any) {
      console.error("Pi payment cancel error:", error);
      res.status(500).json({ message: error.message || "Failed to cancel Pi payment" });
    }
  });

  // Reconciliation endpoint for incomplete payments Pi reports on app re-open.
  app.post('/api/pi/incomplete', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { paymentId } = req.body;
      if (!paymentId) return res.status(400).json({ message: "paymentId is required" });
      const payment = await getPiPayment(paymentId);
      const escrowId = payment?.metadata?.escrowId;
      if (escrowId && payment?.transaction?.txid) {
        const escrow = await storage.getEscrow(escrowId);
        if (escrow && escrow.buyerId === req.user.claims.sub && escrow.status === 'CREATED') {
          await completePiPayment(paymentId, payment.transaction.txid);
          await storage.updateEscrow(escrowId, {
            piPaymentId: paymentId,
            piTxid: payment.transaction.txid,
            buyerTxHash: payment.transaction.txid,
            status: 'FUNDED',
            paymentSubmittedAt: new Date(),
          } as any);
        }
      }
      res.json({ status: "reconciled" });
    } catch (error: any) {
      console.error("Pi payment reconciliation error:", error);
      res.status(500).json({ message: error.message || "Failed to reconcile Pi payment" });
    }
  });

  // Wallet routes
  app.get('/api/wallets', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallets = await storage.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post('/api/wallets', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const walletData = insertWalletSchema.parse({ ...req.body, userId });
      
      const wallet = await storage.createWallet(walletData);
      res.status(201).json(wallet);
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      res.status(400).json({ message: error.message || "Failed to create wallet" });
    }
  });

  app.delete('/api/wallets/:id', isAuthenticatedEnhanced, async (req, res) => {
    try {
      await storage.deleteWallet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting wallet:", error);
      res.status(500).json({ message: "Failed to delete wallet" });
    }
  });

  // Listing routes
  app.get('/api/listings', async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        currency: req.query.currency as string,
        location: req.query.location as string,
        search: req.query.search as string,
      };
      
      const listings = await storage.getListings(filters);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get('/api/listings/slug/:slug', async (req, res) => {
    try {
      const listing = await storage.getListingBySlug(req.params.slug);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.get('/api/listings/:id', async (req, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post('/api/listings', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingData = insertListingSchema.parse({
        ...req.body,
        sellerId: userId,
        approvalStatus: 'PENDING',
        slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
      });
      
      const listing = await storage.createListing(listingData);

      // Notify the seller their listing is under review
      await storage.createNotification({
        userId,
        type: 'LISTING_SUBMITTED',
        title: 'Listing Submitted for Review',
        message: `Your listing "${listing.title}" has been submitted and is pending admin approval. You'll be notified once it's reviewed.`,
        data: { listingId: listing.id },
      }).catch(() => {});

      // Notify all admins of new pending listing
      try {
        const admins = await storage.getAdminUsers?.();
        if (admins?.length) {
          await Promise.all(admins.map((admin: any) =>
            storage.createNotification({
              userId: admin.id,
              type: 'LISTING_PENDING_REVIEW',
              title: 'New Listing Awaiting Approval',
              message: `A new listing "${listing.title}" has been submitted and requires your review.`,
              data: { listingId: listing.id },
            }).catch(() => {})
          ));
        }
      } catch {}

      res.status(201).json(listing);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: error.message || "Failed to create listing" });
    }
  });

  app.patch('/api/listings/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify ownership
      const existing = await storage.getListing(req.params.id);
      if (!existing) return res.status(404).json({ message: "Listing not found" });
      if (existing.sellerId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "You are not authorized to edit this listing" });
      }
      const listingData = insertListingSchema.partial().parse(req.body);
      const listing = await storage.updateListing(req.params.id, listingData);
      res.json(listing);
    } catch (error: any) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: error.message || "Failed to update listing" });
    }
  });

  app.delete('/api/listings/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Verify ownership
      const existing = await storage.getListing(req.params.id);
      if (!existing) return res.status(404).json({ message: "Listing not found" });
      if (existing.sellerId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "You are not authorized to delete this listing" });
      }
      await storage.deleteListing(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.get('/api/user/listings', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listings = await storage.getUserListings(userId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });

  // Review routes
  app.get('/api/listings/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getListingReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({ ...req.body, reviewerId: userId });
      
      // Check if user can review
      const canReview = await storage.canUserReview(userId, reviewData.listingId);
      if (!canReview) {
        return res.status(403).json({ message: "You can only review after completing an escrow transaction" });
      }
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // Escrow routes
  app.get('/api/escrows', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = {
        status: req.query.status as string,
        userId: req.query.admin === 'true' ? undefined : userId,
      };
      
      const escrows = await storage.getEscrows(filters);
      res.json(escrows);
    } catch (error) {
      console.error("Error fetching escrows:", error);
      res.status(500).json({ message: "Failed to fetch escrows" });
    }
  });

  app.get('/api/escrows/:id', isAuthenticatedEnhanced, async (req, res) => {
    try {
      const escrow = await storage.getEscrow(req.params.id);
      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }
      res.json(escrow);
    } catch (error) {
      console.error("Error fetching escrow:", error);
      res.status(500).json({ message: "Failed to fetch escrow" });
    }
  });

  app.post('/api/escrows', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Resolve platform fee % from admin settings based on listing type
      let platformFeePct = 10; // fallback
      try {
        if (req.body.listingId) {
          const listing = await storage.getListing(req.body.listingId);
          const feeKeyMap: Record<string, string> = {
            REAL_ESTATE: 'fee_real_estate',
            SHIPPING_SERVICE: 'fee_shipping_service',
            PRODUCT: 'fee_product',
            SERVICE: 'fee_service',
          };
          const feeKey = listing ? feeKeyMap[listing.type] || 'fee_product' : 'fee_product';
          const setting = await storage.getPlatformSetting(feeKey);
          if (setting && setting.value !== null && setting.value !== undefined) {
            const parsed = parseFloat(String(setting.value));
            if (!isNaN(parsed)) platformFeePct = parsed;
          }
        }
      } catch { /* use fallback */ }

      const amount = parseFloat(req.body.amount || '0');
      const platformFeeAmount = amount * (platformFeePct / 100);
      const sellerNetAmount = amount - platformFeeAmount;

      const escrowData = insertEscrowSchema.parse({
        ...req.body,
        buyerId: userId,
        platformFeePct: platformFeePct.toString(),
        platformFeeAmount: platformFeeAmount.toString(),
        sellerNetAmount: sellerNetAmount.toString(),
      });

      const escrow = await storage.createEscrow(escrowData);

      // Create chat thread for the escrow
      await storage.getOrCreateChatThread(escrow.listingId, escrow.buyerId, escrow.sellerId, escrow.id);

      res.status(201).json(escrow);
    } catch (error: any) {
      console.error("Error creating escrow:", error);
      res.status(400).json({ message: error.message || "Failed to create escrow" });
    }
  });

  app.patch('/api/escrows/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Pull out shipping sub-fields that live in metadata.shipping
      const { shippingOption, shippingCost, shippingAddress, ...restBody } = req.body;
      // shippingFee / shippingFeeCurrency are proper DB columns — keep in restBody so they're parsed by schema
      const escrowData = insertEscrowSchema.partial().parse(restBody);
      const existing = await storage.getEscrow(req.params.id);
      if (!existing) return res.status(404).json({ message: "Escrow not found" });

      // Persist shipping metadata from buyer's selection into escrow.metadata.shipping
      const hasShippingUpdate = shippingOption !== undefined || shippingCost !== undefined || shippingAddress !== undefined;
      if (hasShippingUpdate) {
        const existingMeta = (existing.metadata as any) || {};
        const existingShipping = existingMeta.shipping || {};
        (escrowData as any).metadata = {
          ...existingMeta,
          ...(escrowData as any).metadata,
          shipping: {
            ...existingShipping,
            ...(shippingOption !== undefined && { option: shippingOption }),
            ...(shippingCost !== undefined && { cost: String(shippingCost) }),
            ...(shippingAddress !== undefined && { address: shippingAddress }),
          },
        };
      }

      // Authorisation: enforce who can trigger each status transition
      if (escrowData.status) {
        const currentUser = await storage.getUser(userId);
        const isAdmin = currentUser?.role === 'ADMIN';
        const isBuyer = existing.buyerId === userId;
        const isSeller = existing.sellerId === userId;
        const newStatus = escrowData.status;
        const oldStatus = existing.status;

        const transitions: Record<string, { from: string[]; actors: string[] }> = {
          PAYMENT_SUBMITTED: { from: ['CREATED'],            actors: ['buyer'] },
          FUNDED:            { from: ['PAYMENT_SUBMITTED'],  actors: ['admin'] },
          CREATED:           { from: ['PAYMENT_SUBMITTED'],  actors: ['admin'] }, // admin rejection
          SHIPPED:           { from: ['FUNDED'],             actors: ['seller', 'admin'] },
          DELIVERED:         { from: ['SHIPPED'],            actors: ['buyer', 'admin'] },
          RELEASED:          { from: ['FUNDED', 'SHIPPED', 'DELIVERED'], actors: ['admin'] },
          DISPUTED:          { from: ['FUNDED', 'SHIPPED', 'DELIVERED'], actors: ['buyer', 'seller', 'admin'] },
          CANCELLED:         { from: ['CREATED', 'PAYMENT_SUBMITTED'],   actors: ['buyer', 'seller', 'admin'] },
        };

        const rule = transitions[newStatus];
        if (rule) {
          if (!rule.from.includes(oldStatus)) {
            return res.status(400).json({ message: `Cannot change status from ${oldStatus} to ${newStatus}` });
          }
          const allowed = rule.actors.some(a =>
            (a === 'admin' && isAdmin) ||
            (a === 'buyer' && isBuyer) ||
            (a === 'seller' && isSeller)
          );
          if (!allowed) {
            return res.status(403).json({ message: `You are not authorised to set status to ${newStatus}` });
          }
        }
      }

      // Calculate fees if status is being updated to RELEASED
      if (escrowData.status === 'RELEASED') {
        const platformFeeAmount = Number(existing.amount) * (Number(existing.platformFeePct) / 100);
        const sellerNetAmount = Number(existing.amount) - platformFeeAmount;
        escrowData.platformFeeAmount = platformFeeAmount.toString();
        escrowData.sellerNetAmount = sellerNetAmount.toString();
        // Mark the listing as inactive and sold out so it disappears from marketplace
        try {
          const listingRecord = await storage.getListing(existing.listingId);
          if (listingRecord) {
            await storage.updateListing(existing.listingId, {
              isActive: false,
              metadata: { ...(listingRecord.metadata as any || {}), soldOut: true, soldAt: new Date().toISOString() },
            } as any);
          }
        } catch (e) { console.warn('Could not mark listing as sold:', e); }
        // Notify buyer and seller that funds have been released
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your listing',
            message: 'Funds have been released to you! Transaction complete.',
            action: 'funds_released',
          },
        });
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your purchase',
            message: 'Transaction complete. Funds have been released to the seller.',
            action: 'transaction_complete',
          },
        });
      }

      // When buyer submits payment — move to PAYMENT_SUBMITTED, notify seller + admins
      if (escrowData.status === 'PAYMENT_SUBMITTED') {
        (escrowData as any).paymentSubmittedAt = new Date();
        // Notify the seller
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your listing',
            message: 'A buyer has submitted payment for review. Please wait for admin approval.',
            action: 'payment_submitted',
          },
        });
        // Notify all admins
        try {
          const { db } = await import('./db');
          const { users: usersTable } = await import('@shared/schema');
          const { eq } = await import('drizzle-orm');
          const admins = await db.select().from(usersTable).where(eq(usersTable.role, 'ADMIN'));
          for (const admin of admins) {
            await storage.createNotification({
              userId: admin.id,
              type: 'ESCROW_UPDATE',
              data: {
                escrowId: existing.id,
                listingTitle: (existing as any).listing?.title ?? 'a listing',
                buyerUsername: (existing as any).buyer?.username ?? 'a buyer',
                message: 'New payment submitted and awaiting your review.',
                action: 'payment_needs_review',
              },
            });
          }
        } catch (e) { console.warn('Could not notify admins:', e); }
      }

      // When admin approves (FUNDED) — notify buyer and seller
      if (escrowData.status === 'FUNDED' && existing.status === 'PAYMENT_SUBMITTED') {
        (escrowData as any).adminReviewedAt = new Date();
        (escrowData as any).adminReviewedBy = userId;
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your purchase',
            message: 'Your payment has been verified and approved! The escrow is now active.',
            action: 'payment_approved',
          },
        });
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your listing',
            message: 'Payment has been verified. You can now proceed with the order.',
            action: 'payment_approved',
          },
        });
      }

      // Auto-create a shipment record so delivery agents can see and claim the order
      if (escrowData.status === 'FUNDED' && existing.status === 'PAYMENT_SUBMITTED') {
        try {
          const meta = (existing.metadata as any) || {};
          const shippingMeta = meta.shipping || {};
          const shippingOpt = shippingMeta.option;
          const shippingCostNGN = shippingMeta.cost;
          if (shippingOpt && shippingOpt !== 'SELF_PICKUP') {
            const { db } = await import('./db');
            const { shipments: shipmentsTable } = await import('@shared/schema');
            const { eq: eqFn } = await import('drizzle-orm');
            const existingShipments = await db.select({ id: shipmentsTable.id })
              .from(shipmentsTable).where(eqFn(shipmentsTable.escrowId, existing.id));
            if (existingShipments.length === 0) {
              const addrMeta = meta.shippingAddress || shippingMeta.address || {};
              const sellerUser = await storage.getUser(existing.sellerId);
              const trackingNum = `BG-${Date.now().toString(36).toUpperCase()}`;
              const destParts = [addrMeta.addressLine1, addrMeta.city, addrMeta.country].filter(Boolean);
              await storage.createShipment({
                escrowId: existing.id,
                sellerId: existing.sellerId,
                buyerId: existing.buyerId,
                trackingNumber: trackingNum,
                carrier: 'Beagvs Logistics',
                serviceType: shippingOpt,
                origin: sellerUser?.location || 'Seller location TBD',
                destination: destParts.length > 0 ? destParts.join(', ') : 'Delivery address pending',
                recipientName: addrMeta.recipientName || '',
                recipientPhone: addrMeta.recipientPhone || '',
                specialInstructions: shippingCostNGN && parseFloat(shippingCostNGN) > 0
                  ? `Shipping fee: ₦${parseFloat(shippingCostNGN).toLocaleString()} NGN` : undefined,
              } as any);
            }
          }
        } catch (e) { console.warn('Could not auto-create shipment for escrow:', e); }
      }

      // When admin rejects (back to CREATED) — notify buyer
      if (escrowData.status === 'CREATED' && existing.status === 'PAYMENT_SUBMITTED') {
        (escrowData as any).adminReviewedAt = new Date();
        (escrowData as any).adminReviewedBy = userId;
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your purchase',
            message: `Your payment submission was rejected. Reason: ${req.body.adminNote || 'Please check your payment details and try again.'}`,
            action: 'payment_rejected',
          },
        });
      }

      // When seller marks as shipped (FUNDED → SHIPPED)
      if (escrowData.status === 'SHIPPED' && existing.status === 'FUNDED') {
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your purchase',
            message: 'Your order has been shipped! Please confirm delivery once you receive it.',
            action: 'order_shipped',
          },
        });
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your listing',
            message: 'You marked this order as shipped. Awaiting buyer delivery confirmation.',
            action: 'order_shipped_seller',
          },
        });
      }

      // When buyer confirms delivery (SHIPPED → DELIVERED)
      if (escrowData.status === 'DELIVERED' && existing.status === 'SHIPPED') {
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            escrowId: existing.id,
            listingTitle: (existing as any).listing?.title ?? 'your listing',
            message: 'Buyer confirmed delivery! Funds will be released to you shortly.',
            action: 'delivery_confirmed',
          },
        });
        // Notify admins to release funds
        try {
          const { db } = await import('./db');
          const { users: usersTable } = await import('@shared/schema');
          const { eq: eqOp } = await import('drizzle-orm');
          const admins = await db.select().from(usersTable).where(eqOp(usersTable.role, 'ADMIN'));
          for (const admin of admins) {
            await storage.createNotification({
              userId: admin.id,
              type: 'ESCROW_UPDATE',
              data: {
                escrowId: existing.id,
                listingTitle: (existing as any).listing?.title ?? 'a listing',
                buyerUsername: (existing as any).buyer?.username ?? 'a buyer',
                message: 'Buyer confirmed delivery. Please release funds to the seller.',
                action: 'release_funds_needed',
              },
            });
          }
        } catch (e) { console.warn('Could not notify admins of delivery:', e); }
      }

      const escrow = await storage.updateEscrow(req.params.id, escrowData);
      res.json(escrow);
    } catch (error: any) {
      console.error("Error updating escrow:", error);
      res.status(400).json({ message: error.message || "Failed to update escrow" });
    }
  });

  // Upload payment receipt (multipart — saves to /public/uploads/receipts/)
  app.post('/api/escrows/:id/upload-receipt', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { saveImage } = await import('./imageStorage');
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks);
          // Detect content type from header
          const contentType = req.headers['content-type'] || 'image/jpeg';
          const ext = contentType.includes('pdf') ? 'pdf'
            : contentType.includes('png') ? 'png'
            : contentType.includes('gif') ? 'gif'
            : 'jpg';
          const url = await saveImage(body, ext);
          res.json({ url });
        } catch (e: any) {
          res.status(500).json({ message: e.message || 'Upload failed' });
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Upload failed' });
    }
  });

  app.get('/api/user/escrows', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const escrows = await storage.getUserEscrows(userId);
      res.json(escrows);
    } catch (error) {
      console.error("Error fetching user escrows:", error);
      res.status(500).json({ message: "Failed to fetch user escrows" });
    }
  });

  // Follow routes
  app.get('/api/follows/status/:userId', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followeeId = req.params.userId;
      const follow = await storage.getFollowStatus(followerId, followeeId);
      // Return null explicitly (not undefined) so the client can distinguish "not following" from error
      res.json(follow ?? null);
    } catch (error) {
      console.error("Error fetching follow status:", error);
      res.status(500).json({ message: "Failed to fetch follow status" });
    }
  });

  app.post('/api/follows', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followData = insertFollowSchema.parse({ ...req.body, followerId });
      
      const follow = await storage.createFollow(followData);
      
      // Create notification for follow request
      await storage.createNotification({
        userId: followData.followeeId,
        type: 'FOLLOW_REQUEST',
        data: { followerId, followId: follow.id },
      });
      
      res.status(201).json(follow);
    } catch (error: any) {
      console.error("Error creating follow:", error);
      res.status(400).json({ message: error.message || "Failed to create follow" });
    }
  });

  app.patch('/api/follows/:id', isAuthenticatedEnhanced, async (req, res) => {
    try {
      const { status } = req.body;
      const follow = await storage.updateFollow(req.params.id, status);
      res.json(follow);
    } catch (error: any) {
      console.error("Error updating follow:", error);
      res.status(400).json({ message: error.message || "Failed to update follow" });
    }
  });

  app.delete('/api/follows/:followeeId', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followeeId = req.params.followeeId;
      await storage.deleteFollow(followerId, followeeId);
      res.json({ message: "Unfollowed successfully" });
    } catch (error: any) {
      console.error("Error deleting follow:", error);
      res.status(400).json({ message: error.message || "Failed to unfollow" });
    }
  });

  app.get('/api/user/followers', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/user/following', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get('/api/user/follow-requests', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getFollowRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      res.status(500).json({ message: "Failed to fetch follow requests" });
    }
  });

  // Message routes
  app.get('/api/messages/:threadId', isAuthenticatedEnhanced, async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.threadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      
      const message = await storage.createMessage(messageData);
      
      // Create notification for new message
      await storage.createNotification({
        userId: messageData.recipientId,
        type: 'MESSAGE',
        data: { senderId, messageId: message.id, threadId: messageData.threadId },
      });
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to create message" });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticatedEnhanced, async (req, res) => {
    try {
      await storage.markMessageAsRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get('/api/user/threads', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threads = await storage.getUserThreads(userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticatedEnhanced, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Admin middleware function
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(403).json({ message: "Admin access required" });
    }
  };

  // Payment method routes
  app.get('/api/payment-methods', async (req, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods.filter(pm => pm.isActive));
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Admin payment method management
  app.get('/api/admin/payment-methods', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post('/api/admin/payment-methods', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const paymentMethodData = insertPaymentMethodSchema.parse(req.body);
      const paymentMethod = await storage.createPaymentMethod(paymentMethodData);
      res.status(201).json(paymentMethod);
    } catch (error: any) {
      console.error("Error creating payment method:", error);
      res.status(400).json({ message: error.message || "Failed to create payment method" });
    }
  });

  app.patch('/api/admin/payment-methods/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const paymentMethodData = insertPaymentMethodSchema.partial().parse(req.body);
      const paymentMethod = await storage.updatePaymentMethod(req.params.id, paymentMethodData);
      res.json(paymentMethod);
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      res.status(400).json({ message: error.message || "Failed to update payment method" });
    }
  });

  app.delete('/api/admin/payment-methods/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      await storage.deletePaymentMethod(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  // Admin user management
  app.get('/api/admin/users', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(400).json({ message: error.message || "Failed to update user role" });
    }
  });

  app.get('/api/admin/escrows', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const escrows = await storage.getAllEscrows();
      res.json(escrows);
    } catch (error: any) {
      console.error("Error fetching all escrows:", error);
      res.status(500).json({ message: "Failed to fetch escrows" });
    }
  });

  // User account type switching
  app.patch('/api/user/account-type', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accountType } = req.body;
      const user = await storage.updateUserAccountType(userId, accountType);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating account type:", error);
      res.status(400).json({ message: error.message || "Failed to update account type" });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req, res) => {
    try {
      const published = req.query.published === 'false' ? false : true;
      const posts = await storage.getBlogPosts(published);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/blog', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const postData = insertBlogPostSchema.parse({
        ...req.body,
        authorId: userId,
        slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
      });
      
      const post = await storage.createBlogPost(postData);

      // Auto-ping Google when a published blog post is created
      if (postData.published && post.slug) {
        getSiteUrl().then((baseUrl) => {
          const url = `${baseUrl}/blog/${post.slug}`;
          fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap.xml`)}`).catch(() => {});
          console.log(`[seo] Auto-pinged Google for new blog post: ${url}`);
        }).catch(() => {});
      }

      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      res.status(400).json({ message: error.message || "Failed to create blog post" });
    }
  });

  app.patch('/api/blog/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Only allow updating content fields — never touch authorId or slug via PATCH
      const updateSchema = insertBlogPostSchema.omit({ authorId: true, slug: true }).partial();
      const rawData = updateSchema.parse(req.body);

      // Strip undefined values so Drizzle doesn't attempt to set required columns to NULL
      const postData = Object.fromEntries(
        Object.entries(rawData).filter(([, v]) => v !== undefined)
      ) as Partial<typeof rawData>;

      if (Object.keys(postData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const post = await storage.updateBlogPost(req.params.id, postData);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Auto-ping Google when a blog post is published (published flipped to true)
      if (postData.published === true && post.slug) {
        getSiteUrl().then((baseUrl) => {
          fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap.xml`)}`).catch(() => {});
          console.log(`[seo] Auto-pinged Google for updated blog post: /blog/${post.slug}`);
        }).catch(() => {});
      }

      res.json(post);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      res.status(400).json({ message: error.message || "Failed to update blog post" });
    }
  });

  app.delete('/api/blog/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteBlogPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Admin: get ALL blog posts (including drafts) for admin management
  app.get('/api/admin/blog', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const posts = await storage.getBlogPosts(undefined);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching all blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Platform wallet routes (admin only)
  app.get('/api/platform-wallets', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const wallets = await storage.getPlatformWallets();
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching platform wallets:", error);
      res.status(500).json({ message: "Failed to fetch platform wallets" });
    }
  });

  app.post('/api/platform-wallets', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const walletData = insertPlatformWalletSchema.parse(req.body);
      const wallet = await storage.createPlatformWallet(walletData);
      res.status(201).json(wallet);
    } catch (error: any) {
      console.error("Error creating platform wallet:", error);
      res.status(400).json({ message: error.message || "Failed to create platform wallet" });
    }
  });

  app.patch('/api/platform-wallets/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const walletData = insertPlatformWalletSchema.partial().parse(req.body);
      const wallet = await storage.updatePlatformWallet(req.params.id, walletData);
      res.json(wallet);
    } catch (error: any) {
      console.error("Error updating platform wallet:", error);
      res.status(400).json({ message: error.message || "Failed to update platform wallet" });
    }
  });

  app.delete('/api/platform-wallets/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deletePlatformWallet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting platform wallet:", error);
      res.status(500).json({ message: "Failed to delete platform wallet" });
    }
  });

  // Get platform wallet by currency and network for escrow
  app.get('/api/platform-wallets/currency/:currency/network/:network', async (req, res) => {
    try {
      const { currency, network } = req.params;
      
      // Fiat/bank transfer currencies don't use platform crypto wallets
      const fiatCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'NGN'];
      if (fiatCurrencies.includes(currency.toUpperCase())) {
        return res.status(200).json({ type: 'BANK_TRANSFER', currency, network, address: null });
      }
      
      let walletType = '';
      if (currency.toUpperCase() === 'PI') {
        walletType = 'PI';
      } else if (currency.toUpperCase() === 'USDT') {
        walletType = `USDT_${network.toUpperCase()}`;
      }
      
      if (!walletType) {
        return res.status(404).json({ message: "Unsupported currency/network combination" });
      }
      
      const wallet = await storage.getPlatformWalletByType(walletType);
      if (!wallet) {
        return res.status(404).json({ message: "Platform wallet not configured for this currency/network" });
      }
      
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching platform wallet:", error);
      res.status(500).json({ message: "Failed to fetch platform wallet" });
    }
  });

  // Contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const { firstName, lastName, email, subject, message } = req.body;
      
      // For MVP, just log to console
      console.log('Contact form submission:', {
        name: `${firstName} ${lastName}`,
        email,
        subject,
        message,
        timestamp: new Date().toISOString(),
      });
      
      res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // User profile routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public: get a profile user's accepted followers
  app.get('/api/users/:id/followers', async (req, res) => {
    try {
      const followers = await storage.getUserFollowers(req.params.id);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching user followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  // Public: get who a profile user follows
  app.get('/api/users/:id/following', async (req, res) => {
    try {
      const following = await storage.getUserFollowing(req.params.id);
      res.json(following);
    } catch (error) {
      console.error("Error fetching user following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Cancel a pending follow request (the follower cancels their own request)
  app.delete('/api/follows/cancel/:followeeId', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      await storage.deleteFollow(followerId, req.params.followeeId);
      res.json({ message: "Follow request cancelled" });
    } catch (error: any) {
      console.error("Error cancelling follow request:", error);
      res.status(400).json({ message: error.message || "Failed to cancel follow request" });
    }
  });

  // Chat routes
  app.post('/api/chat/threads', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { listingId, sellerId, escrowId } = req.body;
      const buyerId = req.user.claims.sub;

      // Prevent users from creating threads with themselves
      if (buyerId === sellerId) {
        return res.status(400).json({ message: "Cannot create chat thread with yourself" });
      }

      const thread = await storage.getOrCreateChatThread(listingId, buyerId, sellerId, escrowId);
      res.json(thread);
    } catch (error) {
      console.error("Error creating chat thread:", error);
      res.status(500).json({ message: "Failed to create chat thread" });
    }
  });

  app.get('/api/chat/threads', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threads = await storage.getUserChatThreads(userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching chat threads:", error);
      res.status(500).json({ message: "Failed to fetch chat threads" });
    }
  });

  app.get('/api/chat/threads/:threadId/messages', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { threadId } = req.params;
      const messages = await storage.getChatThreadMessages(threadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/threads/:threadId/messages', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { threadId } = req.params;
      const { content, recipientId } = req.body;
      const senderId = req.user.claims.sub;

      const messageData = {
        threadId,
        senderId,
        recipientId,
        content,
        messageType: 'text' as const,
      };

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.patch('/api/chat/messages/:messageId/read', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Admin chat route — see all escrow threads
  app.get('/api/admin/chat/threads', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const threads = await storage.getAllChatThreads();
      res.json(threads);
    } catch (error) {
      console.error("Error fetching all chat threads:", error);
      res.status(500).json({ message: "Failed to fetch chat threads" });
    }
  });

  // KYC Verification routes
  app.get('/api/kyc/status', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
        kycApprovedAt: user.kycApprovedAt,
        kycRejectedAt: user.kycRejectedAt,
        kycRejectionReason: user.kycRejectionReason,
      });
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      res.status(500).json({ message: "Failed to fetch KYC status" });
    }
  });

  app.post('/api/kyc/upload-facial', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const kycDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
      fs.mkdirSync(kycDir, { recursive: true });

      const filename = `facial-${userId}-${Date.now()}.jpg`;
      const filepath = path.join(kycDir, filename);
      fs.writeFileSync(filepath, buffer);

      res.json({ url: `/uploads/kyc/${filename}` });
    } catch (error) {
      console.error("Error uploading facial photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.post('/api/kyc/upload-document', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageData, documentType, mimeType = 'image/jpeg' } = req.body;

      if (!imageData) {
        return res.status(400).json({ message: "Document data is required" });
      }

      const base64Data = imageData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const kycDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
      fs.mkdirSync(kycDir, { recursive: true });

      const ext = mimeType.includes('pdf') ? 'pdf' : 'jpg';
      const filename = `doc-${userId}-${documentType || 'id'}-${Date.now()}.${ext}`;
      const filepath = path.join(kycDir, filename);
      fs.writeFileSync(filepath, buffer);

      res.json({ url: `/uploads/kyc/${filename}` });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.post('/api/kyc/submit', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { facialImageUrl, documentUrl, documentForm } = req.body;

      // Update user KYC status
      await storage.updateUserKycStatus(userId, 'UNDER_REVIEW');

      // Create notification
      await storage.createNotification({
        userId,
        type: 'KYC_STATUS',
        data: { status: 'UNDER_REVIEW' },
      });

      res.json({ 
        message: 'KYC verification submitted successfully'
      });
    } catch (error: any) {
      console.error("Error submitting KYC:", error);
      res.status(400).json({ message: error.message || "Failed to submit KYC verification" });
    }
  });

  // ─── Platform Settings Routes (fee management etc.) ─────────────────────────

  // Public: get all platform settings (for checkout fee calculation)
  app.get('/api/platform-settings', async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform settings" });
    }
  });

  app.get('/api/platform-settings/:key', async (req, res) => {
    try {
      const setting = await storage.getPlatformSetting(req.params.key);
      if (!setting) return res.status(404).json({ message: "Setting not found" });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  // Admin: upsert a setting
  app.put('/api/platform-settings/:key', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN') return res.status(403).json({ message: "Admin only" });
      const { value, description } = req.body;
      const setting = await storage.upsertPlatformSetting(req.params.key, value, description, userId);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update setting" });
    }
  });

  app.delete('/api/platform-settings/:key', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN') return res.status(403).json({ message: "Admin only" });
      await storage.deletePlatformSetting(req.params.key);
      res.json({ message: "Setting deleted" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // ─── Image Upload (any authenticated user) ─────────────────────────────────

  app.post('/api/upload-image', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { base64, filename } = req.body;
      if (!base64 || !filename) return res.status(400).json({ message: "Missing base64 or filename" });
      const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const dataStr = base64.includes(",") ? base64.split(",")[1] : base64;
      const buffer = Buffer.from(dataStr, "base64");
      const url = await saveImage(buffer, ext);
      res.json({ url });
    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Proxy route: serve images stored in Replit Object Storage
  app.get('/api/img/:bucket/*', async (req: any, res) => {
    try {
      const { bucket } = req.params;
      const objectName = req.params[0];
      if (!bucket || !objectName) return res.status(400).end();
      await serveStoredImage(bucket, objectName, res);
    } catch {
      res.status(404).end();
    }
  });

  // ─── Public Shipping Booking ────────────────────────────────────────────────

  // Public: book a shipment — creates user account if email is new
  app.post('/api/shipping/book', async (req: any, res) => {
    try {
      const {
        fullName, email, phone, origin, originCountry,
        destination, destinationCountry, cargoType, weightKg,
        serviceType, additionalNotes, estimatedDelivery,
      } = req.body;

      if (!fullName || !email || !phone || !origin || !destination) {
        return res.status(400).json({ message: "Missing required fields: fullName, email, phone, origin, destination" });
      }

      // Find or create user
      let user = await storage.getUserByEmail(email);
      let isNewUser = false;
      let tempPassword: string | null = null;

      if (!user) {
        isNewUser = true;
        tempPassword = Math.random().toString(36).slice(2, 10).toUpperCase();
        const firstName = fullName.split(" ")[0];
        const lastName = fullName.split(" ").slice(1).join(" ") || "";
        const baseUsername = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
        const username = baseUsername + Math.floor(Math.random() * 9000 + 1000);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        user = await storage.createUser({
          email, firstName, lastName, username,
          passwordHash, accountType: "BUYER", role: "USER",
        });
      }

      // Find admin (seller for the booking)
      const { db } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq: eqOp } = await import("drizzle-orm");
      const [adminUser] = await db.select().from(usersTable).where(eqOp(usersTable.role, "ADMIN")).limit(1);
      if (!adminUser) return res.status(500).json({ message: "No admin found to handle booking" });

      // Generate tracking number
      const trackingNum = "BGV-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

      // Create shipment
      const shipment = await storage.createShipment({
        trackingNumber: trackingNum,
        carrier: "Beagvs Global",
        sellerId: adminUser.id,
        buyerId: user.id,
        serviceType: serviceType || "Standard",
        origin,
        originCountry: originCountry || "",
        destination,
        destinationCountry: destinationCountry || "",
        recipientName: fullName,
        recipientPhone: phone,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) as any : undefined,
        specialInstructions: additionalNotes || undefined,
        status: "PENDING",
      } as any);

      // Add initial event
      await storage.addShipmentEvent({
        shipmentId: shipment.id,
        status: "PENDING",
        description: `Booking received from ${fullName}. Cargo: ${cargoType || "General"}. Origin: ${origin} → ${destination}.`,
        location: origin,
        country: originCountry || undefined,
      });

      res.status(201).json({
        trackingNumber: trackingNum,
        shipmentId: shipment.id,
        isNewUser,
        tempPassword: isNewUser ? tempPassword : undefined,
        message: isNewUser
          ? `Booking confirmed! A new account was created with your email. Your temporary password is: ${tempPassword}. Please change it after login.`
          : "Booking confirmed! Track your shipment with the tracking number provided.",
      });
    } catch (error: any) {
      console.error("Shipping booking error:", error);
      res.status(500).json({ message: error.message || "Failed to create booking" });
    }
  });

  // ─── Shipment / Tracking Routes ─────────────────────────────────────────────

  // Public: look up any shipment by tracking number (no auth required)
  app.get('/api/tracking/:trackingNumber', async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const shipment = await storage.getShipmentByTrackingNumber(trackingNumber);
      if (!shipment) return res.status(404).json({ message: "Tracking number not found" });
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracking information" });
    }
  });

  // Authenticated: get shipments for current user
  app.get('/api/shipments/me', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userShipments = await storage.getShipmentsByUser(userId);
      res.json(userShipments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  });

  // Get shipment attached to a specific escrow
  app.get('/api/shipments/escrow/:escrowId', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { escrowId } = req.params;
      const shipment = await storage.getShipmentByEscrowId(escrowId);
      if (!shipment) return res.status(404).json({ message: "No shipment found for this escrow" });
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shipment" });
    }
  });

  // Get single shipment by ID
  app.get('/api/shipments/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const { id } = req.params;
      const shipment = await storage.getShipment(id);
      if (!shipment) return res.status(404).json({ message: "Shipment not found" });
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shipment" });
    }
  });

  // Create a new shipment (seller only — must own the escrow)
  app.post('/api/shipments', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = insertShipmentSchema.parse({ ...req.body, sellerId: userId });

      // If linked to an escrow, verify the user is the seller
      if (body.escrowId) {
        const escrow = await storage.getEscrow(body.escrowId);
        if (!escrow) return res.status(404).json({ message: "Escrow not found" });
        if (escrow.sellerId !== userId) return res.status(403).json({ message: "Not authorised" });
        // Automatically set buyerId from escrow
        (body as any).buyerId = escrow.buyerId;
      }

      const shipment = await storage.createShipment(body);

      // Add initial "Shipment Created" event
      await storage.addShipmentEvent({
        shipmentId: shipment.id,
        status: 'PENDING',
        description: 'Shipment created and tracking number assigned',
        location: body.origin || undefined,
        country: body.originCountry || undefined,
        createdBy: userId,
      });

      // Update escrow status to SHIPPED if linked
      if (body.escrowId) {
        await storage.updateEscrow(body.escrowId, { status: 'SHIPPED' });
      }

      const enriched = await storage.getShipment(shipment.id);
      res.status(201).json(enriched);
    } catch (error: any) {
      console.error("Create shipment error:", error);
      res.status(400).json({ message: error.message || "Failed to create shipment" });
    }
  });

  // Update shipment details (seller or admin)
  app.patch('/api/shipments/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const existing = await storage.getShipment(id);
      if (!existing) return res.status(404).json({ message: "Shipment not found" });

      const user = await storage.getUser(userId);
      if (existing.sellerId !== userId && user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Not authorised" });
      }

      const updated = await storage.updateShipment(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update shipment" });
    }
  });

  // Add a tracking event (seller, admin, or assigned delivery agent)
  app.post('/api/shipments/:id/events', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const existing = await storage.getShipment(id);
      if (!existing) return res.status(404).json({ message: "Shipment not found" });

      const user = await storage.getUser(userId);
      const isAssignedAgent = user?.role === 'DELIVERY_AGENT' && (existing as any).agentId === userId;
      if (existing.sellerId !== userId && user?.role !== 'ADMIN' && !isAssignedAgent) {
        return res.status(403).json({ message: "Not authorised" });
      }

      const eventData = insertShipmentEventSchema.parse({
        ...req.body,
        shipmentId: id,
        createdBy: userId,
      });

      // Agents must obey the same state-machine transition rules as the dedicated agent endpoint
      if (isAssignedAgent) {
        const ALLOWED_FROM: Record<string, string[]> = {
          PICKED_UP:        ['PENDING'],
          IN_TRANSIT:       ['PICKED_UP'],
          OUT_FOR_DELIVERY: ['IN_TRANSIT'],
          DELIVERED:        ['OUT_FOR_DELIVERY'],
          FAILED:           ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          RETURNED:         ['FAILED', 'OUT_FOR_DELIVERY'],
        };
        const currentStatus = existing.status ?? 'PENDING';
        const allowed = ALLOWED_FROM[eventData.status] ?? [];
        if (!allowed.includes(currentStatus)) {
          return res.status(400).json({
            message: `Cannot transition from ${currentStatus} to ${eventData.status}. Allowed from: ${allowed.join(', ')}.`,
          });
        }
      }

      const event = await storage.addShipmentEvent(eventData);

      // Sync shipment status with the latest event status
      await storage.updateShipment(id, { status: eventData.status });

      // If delivered, update escrow to DELIVERED — only when escrow is still in SHIPPED state
      if (eventData.status === 'DELIVERED' && existing.escrowId) {
        const currentEscrow = await storage.getEscrow(existing.escrowId);
        if (currentEscrow?.status === 'SHIPPED') {
          await storage.updateEscrow(existing.escrowId, { status: 'DELIVERED' });
        }
        await storage.updateShipment(id, { actualDelivery: new Date() as any });
      }

      res.status(201).json(event);
    } catch (error: any) {
      console.error("Add shipment event error:", error);
      res.status(400).json({ message: error.message || "Failed to add event" });
    }
  });

  // Admin: list all shipments
  app.get('/api/admin/shipments', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN') return res.status(403).json({ message: "Admin only" });
      const all = await storage.getAllShipments();
      res.json(all);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  });

  // ─── Delivery Agent Routes ────────────────────────────────────────────────────

  // Delivery agent middleware
  const isDeliveryAgent = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'DELIVERY_AGENT' && user.role !== 'ADMIN')) {
        return res.status(403).json({ message: "Delivery agent access required" });
      }
      next();
    } catch (error) {
      res.status(403).json({ message: "Delivery agent access required" });
    }
  };

  // Agent: get my assigned shipments
  app.get('/api/agent/shipments', isAuthenticatedEnhanced, isDeliveryAgent, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shipments = await storage.getShipmentsByAgent(userId);
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assigned shipments" });
    }
  });

  // Agent: update shipment status (pickup, in-transit, out-for-delivery, delivered)
  app.post('/api/agent/shipments/:id/status', isAuthenticatedEnhanced, isDeliveryAgent, async (req: any, res) => {
    try {
      const agentId = req.user.claims.sub;
      const { id } = req.params;
      const { status, location, description } = req.body;

      const existing = await storage.getShipment(id);
      if (!existing) return res.status(404).json({ message: "Shipment not found" });

      // Agents can only update their own assigned shipments
      const agent = await storage.getUser(agentId);
      if ((existing as any).agentId !== agentId && agent?.role !== 'ADMIN') {
        return res.status(403).json({ message: "This shipment is not assigned to you" });
      }

      const VALID_AGENT_STATUSES = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'];
      if (!VALID_AGENT_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Allowed: ${VALID_AGENT_STATUSES.join(', ')}` });
      }

      // Enforce forward-only state machine transitions
      const ALLOWED_FROM: Record<string, string[]> = {
        PICKED_UP:        ['PENDING'],
        IN_TRANSIT:       ['PICKED_UP'],
        OUT_FOR_DELIVERY: ['IN_TRANSIT'],
        DELIVERED:        ['OUT_FOR_DELIVERY'],
        FAILED:           ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
        RETURNED:         ['FAILED', 'OUT_FOR_DELIVERY'],
      };
      const currentStatus = existing.status ?? 'PENDING';
      const allowedFromStates = ALLOWED_FROM[status] ?? [];
      if (!allowedFromStates.includes(currentStatus)) {
        return res.status(400).json({
          message: `Cannot transition from ${currentStatus} to ${status}. Allowed from: ${allowedFromStates.join(', ')}.`,
        });
      }

      // Map status → readable description
      const DEFAULT_DESCRIPTIONS: Record<string, string> = {
        PICKED_UP: 'Package picked up by delivery agent',
        IN_TRANSIT: 'Package is in transit',
        OUT_FOR_DELIVERY: 'Package is out for delivery',
        DELIVERED: 'Package delivered to recipient',
        FAILED: 'Delivery attempt failed',
        RETURNED: 'Package returned to sender',
      };

      // Add shipment event
      await storage.addShipmentEvent({
        shipmentId: id,
        status,
        location: location || undefined,
        description: description || DEFAULT_DESCRIPTIONS[status],
        createdBy: agentId,
      });

      // Update shipment status
      const updateData: any = { status };
      if (status === 'DELIVERED') updateData.actualDelivery = new Date();
      await storage.updateShipment(id, updateData);

      // ── Notifications ──────────────────────────────────────────────────────

      const agentUser = await storage.getUser(agentId);
      const agentName = agentUser?.firstName || agentUser?.username || 'Your delivery agent';
      const listingTitle = (existing as any).listing?.title ?? 'your shipment';

      if (status === 'PICKED_UP') {
        // Notify seller
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            shipmentId: id,
            trackingNumber: existing.trackingNumber,
            message: `${agentName} has picked up the package. It is on its way!`,
            action: 'agent_picked_up',
          },
        });
        // Notify admins
        try {
          const { db } = await import('./db');
          const { users: usersTable } = await import('@shared/schema');
          const { eq: eqOp } = await import('drizzle-orm');
          const admins = await db.select().from(usersTable).where(eqOp(usersTable.role, 'ADMIN'));
          for (const admin of admins) {
            await storage.createNotification({
              userId: admin.id,
              type: 'ESCROW_UPDATE',
              data: {
                shipmentId: id,
                trackingNumber: existing.trackingNumber,
                agentName,
                message: `Agent ${agentName} picked up shipment ${existing.trackingNumber}.`,
                action: 'agent_picked_up',
              },
            });
          }
        } catch (e) { console.warn('Could not notify admins of pickup:', e); }
      }

      if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') {
        // Notify buyer
        const statusMsg = status === 'IN_TRANSIT'
          ? `Your package is in transit! Tracking: ${existing.trackingNumber}`
          : `Your package is out for delivery and will arrive soon!`;
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: {
            shipmentId: id,
            trackingNumber: existing.trackingNumber,
            message: statusMsg,
            action: status === 'IN_TRANSIT' ? 'shipment_in_transit' : 'out_for_delivery',
          },
        });
      }

      if (status === 'FAILED' || status === 'RETURNED') {
        const failMsg = status === 'FAILED'
          ? `Delivery failed for shipment ${existing.trackingNumber}. Please contact support.`
          : `Shipment ${existing.trackingNumber} has been returned. Please contact support.`;
        // Notify buyer
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: { shipmentId: id, trackingNumber: existing.trackingNumber, message: failMsg, action: `shipment_${status.toLowerCase()}` },
        });
        // Notify seller
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: { shipmentId: id, trackingNumber: existing.trackingNumber, message: `Shipment ${existing.trackingNumber} marked as ${status}. Admin review may be required.`, action: `shipment_${status.toLowerCase()}` },
        });
        // Notify admins
        try {
          const { db: db2 } = await import('./db');
          const { users: usersTable2 } = await import('@shared/schema');
          const { eq: eqOp2 } = await import('drizzle-orm');
          const admins2 = await db2.select().from(usersTable2).where(eqOp2(usersTable2.role, 'ADMIN'));
          for (const admin of admins2) {
            await storage.createNotification({
              userId: admin.id,
              type: 'ESCROW_UPDATE',
              data: { shipmentId: id, trackingNumber: existing.trackingNumber, agentName, message: `Agent ${agentName} marked shipment ${existing.trackingNumber} as ${status}. Review required.`, action: `shipment_${status.toLowerCase()}` },
            });
          }
        } catch (e) { console.warn('Could not notify admins of failure:', e); }
      }

      if (status === 'DELIVERED') {
        // Only sync escrow if it is still in SHIPPED state (guard against double-advance)
        if (existing.escrowId) {
          const currentEscrow = await storage.getEscrow(existing.escrowId);
          if (currentEscrow?.status === 'SHIPPED') {
            await storage.updateEscrow(existing.escrowId, { status: 'DELIVERED' });
          }
        }

        // Notify buyer
        await storage.createNotification({
          userId: existing.buyerId,
          type: 'ESCROW_UPDATE',
          data: {
            shipmentId: id,
            trackingNumber: existing.trackingNumber,
            message: 'Your package has been delivered! Please confirm receipt in the escrow to release funds to the seller.',
            action: 'agent_delivered',
          },
        });
        // Notify seller
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            shipmentId: id,
            trackingNumber: existing.trackingNumber,
            message: `Package ${existing.trackingNumber} has been delivered. Awaiting buyer confirmation to release funds.`,
            action: 'agent_delivered',
          },
        });
        // Notify admins
        try {
          const { db } = await import('./db');
          const { users: usersTable } = await import('@shared/schema');
          const { eq: eqOp } = await import('drizzle-orm');
          const admins = await db.select().from(usersTable).where(eqOp(usersTable.role, 'ADMIN'));
          for (const admin of admins) {
            await storage.createNotification({
              userId: admin.id,
              type: 'ESCROW_UPDATE',
              data: {
                shipmentId: id,
                trackingNumber: existing.trackingNumber,
                agentName,
                message: `Agent ${agentName} delivered shipment ${existing.trackingNumber}. Buyer must confirm to release funds.`,
                action: 'agent_delivered',
              },
            });
          }
        } catch (e) { console.warn('Could not notify admins of delivery:', e); }
      }

      const updated = await storage.getShipment(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Agent status update error:", error);
      res.status(400).json({ message: error.message || "Failed to update status" });
    }
  });

  // Admin: list all delivery agents
  app.get('/api/admin/delivery-agents', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const agents = await storage.getDeliveryAgents();
      res.json(agents.map(({ passwordHash, ...a }) => a));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery agents" });
    }
  });

  // Admin: assign a delivery agent to a shipment
  app.post('/api/admin/shipments/:id/assign-agent', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { id } = req.params;
      const { agentId } = req.body; // null to unassign

      const existing = await storage.getShipment(id);
      if (!existing) return res.status(404).json({ message: "Shipment not found" });

      // Validate that the target user is actually a delivery agent (or allow null to unassign)
      if (agentId) {
        const targetUser = await storage.getUser(agentId);
        if (!targetUser) return res.status(404).json({ message: "User not found" });
        if (targetUser.role !== 'DELIVERY_AGENT') {
          return res.status(400).json({ message: "The selected user is not a delivery agent" });
        }
      }

      await storage.updateShipment(id, { agentId } as any);

      // If assigning (not clearing), notify the agent
      if (agentId) {
        const agentUser = await storage.getUser(agentId);
        if (agentUser) {
          await storage.createNotification({
            userId: agentId,
            type: 'ESCROW_UPDATE',
            data: {
              shipmentId: id,
              trackingNumber: existing.trackingNumber,
              origin: existing.origin,
              destination: existing.destination,
              message: `You have been assigned a new shipment for pickup. Tracking: ${existing.trackingNumber}${existing.origin ? ` from ${existing.origin}` : ''}${existing.destination ? ` to ${existing.destination}` : ''}.`,
              action: 'agent_assigned',
            },
          });
        }
        // Notify seller that an agent has been assigned
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            shipmentId: id,
            trackingNumber: existing.trackingNumber,
            message: `A delivery agent has been assigned to pick up shipment ${existing.trackingNumber}.`,
            action: 'agent_assigned_seller',
          },
        });
      }

      const updated = await storage.getShipment(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Assign agent error:", error);
      res.status(400).json({ message: error.message || "Failed to assign agent" });
    }
  });

  // ─── Extended Admin Routes ────────────────────────────────────────────────────

  // Admin: get platform stats
  app.get('/api/admin/stats', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin: update user fields (role, accountType, kycStatus, email, name, etc.)
  app.patch('/api/admin/users/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role, accountType, kycStatus, email, firstName, lastName, username } = req.body;
      const data: any = {};
      if (role !== undefined) data.role = role;
      if (accountType !== undefined) data.accountType = accountType;
      if (kycStatus !== undefined) data.kycStatus = kycStatus;
      if (email !== undefined) data.email = email;
      if (firstName !== undefined) data.firstName = firstName;
      if (lastName !== undefined) data.lastName = lastName;
      if (username !== undefined) data.username = username;
      const updated = await storage.updateUser(id, data);
      const { passwordHash, ...publicUser } = updated;
      res.json(publicUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  // Admin: delete user
  app.delete('/api/admin/users/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      if (req.params.id === adminId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: reset a user's password (sets temp password, forces change on next login)
  app.post('/api/admin/users/:id/reset-password', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(id, passwordHash, true);
      res.json({ message: "Password reset. User must change it on next login." });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ─── Change Password (for mustChangePassword flow) ────────────────────────────

  app.post('/api/auth/change-password', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Verify current password if user has one and one is provided
      if (user.passwordHash && currentPassword) {
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(userId, passwordHash, false);
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Check if current user must change password
  app.get('/api/auth/must-change-password', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ mustChangePassword: user?.mustChangePassword ?? false });
    } catch (error) {
      res.status(500).json({ message: "Failed to check" });
    }
  });

  // ─── Page Content Management ──────────────────────────────────────────────────

  // Public: get page content (with defaults)
  app.get('/api/page-content/:page', async (req, res) => {
    try {
      const { page } = req.params;
      const key = `page_content_${page}`;
      const setting = await storage.getPlatformSetting(key);
      res.json(setting?.value ?? null);
    } catch (error: any) {
      console.error("Error fetching page content:", error);
      res.status(500).json({ message: "Failed to fetch page content" });
    }
  });

  // Admin: update page content
  app.put('/api/admin/page-content/:page', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { page } = req.params;
      const key = `page_content_${page}`;
      const userId = req.user.claims.sub;
      const setting = await storage.upsertPlatformSetting(
        key,
        req.body,
        `Content for ${page} page`,
        userId
      );
      res.json(setting.value);
    } catch (error: any) {
      console.error("Error updating page content:", error);
      res.status(500).json({ message: "Failed to update page content" });
    }
  });

  // Admin: seed Nigerian real estate properties
  app.post('/api/admin/seed-properties', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const { seedProperties } = await import("./seed-properties");
      const result = await seedProperties();
      res.json(result);
    } catch (error: any) {
      console.error("Seed error:", error);
      res.status(500).json({ message: error.message || "Failed to seed properties" });
    }
  });

  app.post('/api/admin/seed-blog', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const { seedBlogPosts } = await import("./seed-blog");
      const result = await seedBlogPosts();
      res.json(result);
    } catch (error: any) {
      console.error("Blog seed error:", error);
      res.status(500).json({ message: error.message || "Failed to seed blog posts" });
    }
  });

  // Admin: create new listing
  app.post('/api/admin/listings', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      const { title, description, priceCrypto, currency, network, type, location, images, metadata, isActive } = req.body;
      if (!title) return res.status(400).json({ message: "Title is required" });
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now();
      const listing = await storage.createListing({
        title,
        description: description || "",
        priceCrypto: priceCrypto || "0",
        currency: currency || "NGN",
        network: network || "BANK_TRANSFER",
        type: type || "REAL_ESTATE",
        location: location || "",
        images: images || [],
        metadata: { ...(metadata || {}), whatsapp: "+2348037232210" },
        sellerId: userId,
        slug,
        isActive: isActive !== false,
        approvalStatus: 'APPROVED', // admin-created listings are auto-approved
      } as any);
      res.status(201).json(listing);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create listing" });
    }
  });

  // Admin: upload image (base64) — stores persistently and returns URL
  app.post('/api/admin/upload-image', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { base64, filename } = req.body;
      if (!base64 || !filename) return res.status(400).json({ message: "Missing base64 or filename" });
      const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const dataStr = base64.includes(",") ? base64.split(",")[1] : base64;
      const buffer = Buffer.from(dataStr, "base64");
      const url = await saveImage(buffer, ext);
      res.json({ url });
    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Admin: get all listings (all approval statuses)
  app.get('/api/admin/listings', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const allListings = await storage.getAllListingsAdmin();
      res.json(allListings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Admin: approve or reject a listing
  app.patch('/api/admin/listings/:id/approve', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { status, rejectionReason } = req.body;
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
      }
      const listing = await storage.getListing(req.params.id);
      if (!listing) return res.status(404).json({ message: "Listing not found" });

      const updated = await storage.updateListing(req.params.id, {
        approvalStatus: status,
        isActive: status === 'APPROVED',
      } as any);

      const notifMessage = status === 'APPROVED'
        ? `Great news! Your listing "${listing.title}" has been approved and is now live on the marketplace.`
        : `Your listing "${listing.title}" was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ' Please contact support for more information.'}`;

      await storage.createNotification({
        userId: listing.sellerId,
        type: status === 'APPROVED' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
        title: status === 'APPROVED' ? 'Listing Approved!' : 'Listing Not Approved',
        message: notifMessage,
        data: { listingId: listing.id, rejectionReason },
      }).catch(() => {});

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving listing:", error);
      res.status(500).json({ message: error.message || "Failed to update listing approval" });
    }
  });

  // Admin: update listing (including metadata, images, facilities)
  app.patch('/api/admin/listings/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const safe = insertListingSchema.partial().parse(req.body);
      const listing = await storage.updateListing(id, safe);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      res.json(listing);
    } catch (error: any) {
      console.error("Update listing error:", error);
      res.status(400).json({ message: error.message || "Failed to update listing" });
    }
  });

  // Admin: delete listing
  app.delete('/api/admin/listings/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteListing(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // ─── AI Support Chat ──────────────────────────────────────────────────────

  // Create a new AI support session
  app.post('/api/ai-support/sessions', async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub || undefined;
      const { guestName, guestEmail } = req.body;
      const session = await storage.createAiSupportSession({ userId, guestName, guestEmail });
      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create support session" });
    }
  });

  // Get messages for a session
  app.get('/api/ai-support/sessions/:id/messages', async (req, res) => {
    try {
      const session = await storage.getAiSupportSession(req.params.id);
      if (!session) return res.status(404).json({ message: "Session not found" });
      const msgs = await storage.getAiSupportMessages(req.params.id);
      res.json({ session, messages: msgs });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send user message → get AI reply (streaming SSE)
  app.post('/api/ai-support/sessions/:id/messages', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content, guestName } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: "Message is required" });

      const session = await storage.getAiSupportSession(id);
      if (!session) return res.status(404).json({ message: "Session not found" });

      // Save user message
      await storage.createAiSupportMessage({ sessionId: id, role: 'user', content: content.trim(), senderName: guestName || 'User' });

      // Get conversation history for context
      const history = await storage.getAiSupportMessages(id);
      const { openai, AI_MODEL, SYSTEM_PROMPT } = await import("./openai");

      // Stream AI response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const chatMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...history.filter(m => m.role !== 'admin').map(m => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      const stream = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: chatMessages,
        stream: true,
        max_tokens: 512,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      // Check if AI wants to escalate
      const shouldEscalate = fullResponse.includes('[ESCALATE_TO_ADMIN]');
      const cleanResponse = fullResponse.replace('[ESCALATE_TO_ADMIN]', '').trim();

      await storage.createAiSupportMessage({ sessionId: id, role: 'assistant', content: cleanResponse, senderName: 'Beagvs AI' });

      if (shouldEscalate && session.status === 'open') {
        await storage.updateAiSupportSession(id, { status: 'escalated', escalatedAt: new Date() });
        res.write(`data: ${JSON.stringify({ escalated: true })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true, escalated: shouldEscalate })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("AI support error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI unavailable", done: true })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to process message" });
      }
    }
  });

  // Admin: send message to a session
  app.post('/api/admin/ai-support/sessions/:id/messages', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const admin = await storage.getUser(req.session?.userId || req.user?.claims?.sub);
      const adminName = admin ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Support Rep' : 'Support Rep';
      const msg = await storage.createAiSupportMessage({ sessionId: id, role: 'admin', content, senderName: adminName });
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to send admin message" });
    }
  });

  // Admin: get all AI support sessions
  app.get('/api/admin/ai-support/sessions', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const sessions = await storage.getAllAiSupportSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch support sessions" });
    }
  });

  // Admin: update session status (close/reopen)
  app.patch('/api/admin/ai-support/sessions/:id', isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const session = await storage.updateAiSupportSession(req.params.id, {
        status,
        ...(status === 'closed' ? { closedAt: new Date() } : {}),
      });
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // ─── Competitor Intelligence Routes ────────────────────────────────────────

  app.get("/api/admin/competitors", isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const data = await storage.getCompetitors();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch competitors" });
    }
  });

  app.post("/api/admin/competitors", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const data = insertCompetitorSchema.parse(req.body);
      const c = await storage.createCompetitor(data);
      res.json(c);
    } catch (e: any) {
      console.error("Create competitor error:", e);
      res.status(400).json({ message: e.message || "Failed to create competitor" });
    }
  });

  app.patch("/api/admin/competitors/:id", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const data = insertCompetitorSchema.partial().parse(req.body);
      const c = await storage.updateCompetitor(req.params.id, data);
      res.json(c);
    } catch (e: any) {
      console.error("Update competitor error:", e);
      res.status(400).json({ message: e.message || "Failed to update competitor" });
    }
  });

  app.delete("/api/admin/competitors/:id", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      await storage.deleteCompetitor(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to delete competitor" });
    }
  });

  app.get("/api/admin/competitor-content", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const competitorId = req.query.competitorId as string | undefined;
      const data = await storage.getCompetitorContent(competitorId);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/admin/competitor-content", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const c = await storage.createCompetitorContent(req.body);
      res.json(c);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.patch("/api/admin/competitor-content/:id", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const c = await storage.updateCompetitorContent(req.params.id, req.body);
      res.json(c);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/admin/competitor-content/:id", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      await storage.deleteCompetitorContent(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  app.get("/api/admin/competitors/analytics", isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const data = await storage.getCompetitorAnalytics();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ─── SEO & SITEMAP ────────────────────────────────────────────────────────

  // Helper: get configured site URL
  async function getSiteUrl(): Promise<string> {
    try {
      const setting = await storage.getPlatformSetting("seo_site_url");
      return (setting?.value || "https://beagvsmarine.com").replace(/\/$/, "");
    } catch {
      return "https://beagvsmarine.com";
    }
  }

  // Dynamic XML sitemap — includes all static pages, published blog posts, approved listings
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = await getSiteUrl();

      const staticPages = [
        { path: "/", priority: "1.0", changefreq: "daily" },
        { path: "/marketplace", priority: "0.9", changefreq: "daily" },
        { path: "/real-estate", priority: "0.9", changefreq: "daily" },
        { path: "/shipping", priority: "0.8", changefreq: "weekly" },
        { path: "/blog", priority: "0.8", changefreq: "weekly" },
        { path: "/about", priority: "0.7", changefreq: "monthly" },
        { path: "/contact", priority: "0.7", changefreq: "monthly" },
        { path: "/tracking", priority: "0.6", changefreq: "monthly" },
        { path: "/help", priority: "0.5", changefreq: "monthly" },
        { path: "/careers", priority: "0.5", changefreq: "monthly" },
        { path: "/privacy", priority: "0.3", changefreq: "yearly" },
        { path: "/terms", priority: "0.3", changefreq: "yearly" },
      ];

      const [posts, listings] = await Promise.all([
        storage.getBlogPosts(true),
        storage.getListings({}),
      ]);

      const now = new Date().toISOString();

      const urlEntries = [
        ...staticPages.map(
          (p) =>
            `  <url>\n    <loc>${baseUrl}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
        ),
        ...posts.map((p: any) => {
          const lastmod = p.updatedAt?.toISOString() || p.createdAt?.toISOString() || now;
          return `  <url>\n    <loc>${baseUrl}/blog/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
        }),
        ...listings
          .filter((l: any) => l.approvalStatus === "APPROVED" || l.isActive)
          .map((l: any) => {
            const lastmod = l.updatedAt?.toISOString() || l.createdAt?.toISOString() || now;
            return `  <url>\n    <loc>${baseUrl}/listing/${l.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
          }),
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join("\n")}\n</urlset>`;

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("Sitemap generation error:", err);
      res.status(500).send("<?xml version=\"1.0\"?><urlset/>");
    }
  });

  // Robots.txt
  app.get("/robots.txt", async (_req, res) => {
    try {
      const baseUrl = await getSiteUrl();
      const txt = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /api/",
        "Disallow: /dashboard",
        "Disallow: /account/",
        "Disallow: /kyc",
        "Disallow: /chat/",
        "Disallow: /checkout/",
        "",
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join("\n");
      res.set("Content-Type", "text/plain; charset=utf-8");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(txt);
    } catch (err) {
      res.status(500).send("User-agent: *\nAllow: /");
    }
  });

  // Admin: sitemap JSON preview
  app.get("/api/admin/seo/sitemap-preview", isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const baseUrl = await getSiteUrl();
      const staticPaths = [
        "/", "/marketplace", "/real-estate", "/shipping", "/blog",
        "/about", "/contact", "/tracking", "/help", "/careers", "/privacy", "/terms",
      ];
      const [posts, listings] = await Promise.all([
        storage.getBlogPosts(true),
        storage.getListings({}),
      ]);
      const activeListings = listings.filter((l: any) => l.approvalStatus === "APPROVED" || l.isActive);

      const urls = [
        ...staticPaths.map((p) => ({ loc: `${baseUrl}${p}`, type: "static", priority: p === "/" ? "1.0" : "0.7" })),
        ...posts.map((p: any) => ({ loc: `${baseUrl}/blog/${p.slug}`, type: "blog", priority: "0.7", title: p.title })),
        ...activeListings.map((l: any) => ({ loc: `${baseUrl}/listing/${l.slug}`, type: "listing", priority: "0.6", title: l.title })),
      ];

      res.json({
        urls,
        staticCount: staticPaths.length,
        blogCount: posts.length,
        listingCount: activeListings.length,
        total: urls.length,
        sitemapUrl: `${baseUrl}/sitemap.xml`,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to generate sitemap preview" });
    }
  });

  // Admin: SEO health check
  app.get("/api/admin/seo/health", isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const [posts, listings] = await Promise.all([
        storage.getBlogPosts(true),
        storage.getListings({}),
      ]);

      const postsNoMeta = posts.filter((p: any) => !p.metaDescription || p.metaDescription.length < 10);
      const postsNoExcerpt = posts.filter((p: any) => !p.excerpt || p.excerpt.length < 10);
      const listingsNoDesc = listings.filter((l: any) => !l.description || l.description.length < 50);

      const checks = [
        {
          label: "Blog post meta descriptions",
          status: postsNoMeta.length === 0 ? "ok" : "warn",
          count: postsNoMeta.length,
          detail: postsNoMeta.length === 0
            ? "All published posts have meta descriptions"
            : `${postsNoMeta.length} post(s) missing meta description — add them in Blog editor`,
        },
        {
          label: "Blog post excerpts",
          status: postsNoExcerpt.length === 0 ? "ok" : "warn",
          count: postsNoExcerpt.length,
          detail: postsNoExcerpt.length === 0
            ? "All published posts have excerpts"
            : `${postsNoExcerpt.length} post(s) missing an excerpt`,
        },
        {
          label: "Listing descriptions",
          status: listingsNoDesc.length === 0 ? "ok" : "warn",
          count: listingsNoDesc.length,
          detail: listingsNoDesc.length === 0
            ? "All listings have sufficient descriptions"
            : `${listingsNoDesc.length} listing(s) with short descriptions (< 50 chars)`,
        },
        {
          label: "Sitemap accessible",
          status: "ok",
          count: 0,
          detail: "sitemap.xml is publicly accessible at /sitemap.xml",
        },
        {
          label: "robots.txt accessible",
          status: "ok",
          count: 0,
          detail: "robots.txt is publicly accessible at /robots.txt",
        },
      ];

      res.json({ checks });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to run health check" });
    }
  });

  // Admin: ping Google to re-index sitemap
  app.post("/api/admin/seo/ping-google", isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const baseUrl = await getSiteUrl();
      const sitemapUrl = `${baseUrl}/sitemap.xml`;

      const [googleResp, bingResp] = await Promise.allSettled([
        fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
        fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
      ]);

      const googleOk = googleResp.status === "fulfilled" && googleResp.value.ok;
      const bingOk = bingResp.status === "fulfilled" && bingResp.value.ok;

      res.json({
        success: true,
        google: googleOk,
        bing: bingOk,
        sitemapUrl,
        message: `Sitemap submitted to ${[googleOk && "Google", bingOk && "Bing"].filter(Boolean).join(" & ") || "search engines"}. Google will crawl it within 24 hours.`,
      });
    } catch (err: any) {
      console.error("Google ping error:", err);
      res.status(500).json({ message: "Failed to ping Google" });
    }
  });

  // Admin: ping a specific URL to Google
  app.post("/api/admin/seo/ping-url", isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: "URL is required" });

      // Use Google's IndexNow-style ping via sitemap ping with the URL
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(url)}`);
      res.json({ success: true, url, message: "URL submitted to Google for indexing." });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to ping URL" });
    }
  });

  // Admin: save an SEO setting
  app.post("/api/admin/seo/settings", isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const { key, value } = req.body;
      const allowedKeys = ["seo_ga4_id", "seo_gsc_verification", "seo_site_url"];
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ message: "Invalid setting key" });
      }
      const userId = req.user?.claims?.sub || req.session?.userId;
      await storage.upsertPlatformSetting(key, value, undefined, userId);
      res.json({ success: true, key, value });
    } catch (err: any) {
      console.error("SEO setting save error:", err);
      res.status(500).json({ message: "Failed to save SEO setting" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────

  // ─── Shipping Rates (public) ────────────────────────────────────────────────
  app.get('/api/shipping-rates', async (_req, res) => {
    try {
      const rates = await storage.getShippingRates();
      res.json(rates);
    } catch (err: any) {
      // Table may not exist in production yet — return empty array gracefully
      console.warn('[shipping-rates] Table not ready:', err.message);
      res.json([]);
    }
  });

  // ─── Admin: Shipping Rates Management ───────────────────────────────────────
  app.get('/api/admin/shipping-rates', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const rates = await storage.getShippingRates();
      res.json(rates);
    } catch (err: any) {
      console.warn('[admin/shipping-rates] Table not ready:', err.message);
      res.json([]);
    }
  });

  app.post('/api/admin/shipping-rates/seed', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      await storage.seedDefaultShippingRates();
      const rates = await storage.getShippingRates();
      res.json({ success: true, rates });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch('/api/admin/shipping-rates/:id', isAuthenticatedEnhanced, isAdmin, async (req, res) => {
    try {
      const { price, name, description, estimatedDays, isActive, currency } = req.body;
      const updated = await storage.updateShippingRate(req.params.id, {
        ...(price !== undefined && { price: String(price) }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(estimatedDays !== undefined && { estimatedDays }),
        ...(isActive !== undefined && { isActive }),
        ...(currency !== undefined && { currency }),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Admin: Update escrow with real-time broadcast ──────────────────────────
  app.patch('/api/admin/escrows/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const { status, adminNote, shippingTrackingNumber, shippingCarrier, shippingOption, shippingCost, shippingAddress } = req.body;

      const existing = await storage.getEscrow(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Escrow not found' });

      const updateData: any = { updatedAt: new Date() };
      if (adminNote !== undefined) updateData.adminNote = adminNote;

      // Shipping fields are stored in metadata.shipping (backward-compatible with all DB versions)
      const hasShippingUpdate = shippingTrackingNumber !== undefined || shippingCarrier !== undefined ||
        shippingOption !== undefined || shippingCost !== undefined || shippingAddress !== undefined;
      if (hasShippingUpdate) {
        const existingMeta = (existing.metadata as any) || {};
        const existingShipping = existingMeta.shipping || {};
        updateData.metadata = {
          ...existingMeta,
          shipping: {
            ...existingShipping,
            ...(shippingOption !== undefined && { option: shippingOption }),
            ...(shippingCost !== undefined && { cost: String(shippingCost) }),
            ...(shippingAddress !== undefined && { address: shippingAddress }),
            ...(shippingTrackingNumber !== undefined && { trackingNumber: shippingTrackingNumber }),
            ...(shippingCarrier !== undefined && { carrier: shippingCarrier }),
          },
        };
      }

      if (status && status !== existing.status) {
        updateData.status = status;
        updateData.adminReviewedAt = new Date();
        updateData.adminReviewedBy = userId;

        // Calculate fees on RELEASED
        if (status === 'RELEASED') {
          const platformFeeAmount = Number(existing.amount) * (Number(existing.platformFeePct) / 100);
          updateData.platformFeeAmount = String(platformFeeAmount);
          updateData.sellerNetAmount = String(Number(existing.amount) - platformFeeAmount);
        }

        // Notify buyer and seller of the status change
        const listingTitle = (existing as any).listing?.title ?? 'your order';
        const statusMessages: Record<string, { buyer: string; seller: string }> = {
          FUNDED: { buyer: 'Your payment has been verified and approved! The escrow is now active.', seller: 'Payment has been verified. You can now proceed with the order.' },
          SHIPPED: { buyer: 'Great news! Your order has been shipped. Track it in your dashboard.', seller: 'Order marked as shipped. Awaiting buyer confirmation.' },
          DELIVERED: { buyer: 'Your order has been marked as delivered. Funds will be released shortly.', seller: 'Order confirmed as delivered. Funds will be released to you.' },
          RELEASED: { buyer: 'Transaction complete. Funds have been released to the seller.', seller: 'Funds have been released to you! Transaction complete.' },
          DISPUTED: { buyer: 'A dispute has been opened on this transaction. Our team will review it.', seller: 'A dispute has been opened on this transaction. Our team will review it.' },
          REFUNDED: { buyer: 'Your funds have been refunded. Please check your wallet.', seller: 'This transaction has been refunded to the buyer.' },
          CANCELLED: { buyer: 'This transaction has been cancelled.', seller: 'This transaction has been cancelled.' },
          CREATED: { buyer: `Your payment submission was reviewed. ${adminNote ? 'Note: ' + adminNote : 'Please resubmit if needed.'}`, seller: 'Admin has updated this transaction status.' },
        };

        const msgs = statusMessages[status];
        if (msgs) {
          await storage.createNotification({ userId: existing.buyerId, type: 'ESCROW_UPDATE', data: { escrowId: existing.id, listingTitle, message: msgs.buyer, action: `admin_${status.toLowerCase()}` } });
          await storage.createNotification({ userId: existing.sellerId, type: 'ESCROW_UPDATE', data: { escrowId: existing.id, listingTitle, message: msgs.seller, action: `admin_${status.toLowerCase()}` } });
        }

        // Auto-create a shipment record so delivery agents can see and claim the order
        if (status === 'FUNDED' && existing.status === 'PAYMENT_SUBMITTED') {
          try {
            const meta = (existing.metadata as any) || {};
            const shippingMeta = meta.shipping || {};
            const shippingOpt = shippingMeta.option;
            const shippingCostNGN = shippingMeta.cost;
            if (shippingOpt && shippingOpt !== 'SELF_PICKUP') {
              const { db: dbInst } = await import('./db');
              const { shipments: shipmentsTable } = await import('@shared/schema');
              const { eq: eqFn } = await import('drizzle-orm');
              const existingShipments = await dbInst.select({ id: shipmentsTable.id })
                .from(shipmentsTable).where(eqFn(shipmentsTable.escrowId, existing.id));
              if (existingShipments.length === 0) {
                const addrMeta = meta.shippingAddress || shippingMeta.address || {};
                const sellerUser = await storage.getUser(existing.sellerId);
                const trackingNum = `BG-${Date.now().toString(36).toUpperCase()}`;
                const destParts = [addrMeta.addressLine1, addrMeta.city, addrMeta.country].filter(Boolean);
                await storage.createShipment({
                  escrowId: existing.id,
                  sellerId: existing.sellerId,
                  buyerId: existing.buyerId,
                  trackingNumber: trackingNum,
                  carrier: 'Beagvs Logistics',
                  serviceType: shippingOpt,
                  origin: sellerUser?.location || 'Seller location TBD',
                  destination: destParts.length > 0 ? destParts.join(', ') : 'Delivery address pending',
                  recipientName: addrMeta.recipientName || '',
                  recipientPhone: addrMeta.recipientPhone || '',
                  specialInstructions: shippingCostNGN && parseFloat(shippingCostNGN) > 0
                    ? `Shipping fee: ₦${parseFloat(shippingCostNGN).toLocaleString()} NGN` : undefined,
                } as any);
              }
            }
          } catch (e) { console.warn('Could not auto-create shipment for admin-funded escrow:', e); }
        }
      }

      const updated = await storage.updateEscrow(req.params.id, updateData);
      res.json(updated);
    } catch (err: any) {
      console.error('Admin escrow update error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Bank Account Routes ────────────────────────────────────────────────────

  app.get('/api/bank-accounts', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getBankAccounts(userId);
      res.json(accounts);
    } catch (e: any) {
      res.status(500).json({ message: 'Failed to fetch bank accounts' });
    }
  });

  app.post('/api/bank-accounts', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bankName, accountName, accountNumber, routingNumber, swiftCode, bankAddress, currency, country, isDefault } = req.body;
      if (!bankName || !accountName || !accountNumber) {
        return res.status(400).json({ message: 'bankName, accountName, and accountNumber are required' });
      }
      // If setting as default, clear other defaults first
      if (isDefault) {
        const existing = await storage.getBankAccounts(userId);
        for (const acc of existing) {
          if (acc.isDefault) await storage.updateBankAccount(acc.id, { isDefault: false });
        }
      }
      const account = await storage.createBankAccount({ userId, bankName, accountName, accountNumber, routingNumber, swiftCode, bankAddress, currency: currency || 'NGN', country: country || 'Nigeria', isDefault: !!isDefault });
      res.status(201).json(account);
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'Failed to create bank account' });
    }
  });

  app.patch('/api/bank-accounts/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const accounts = await storage.getBankAccounts(userId);
      if (!accounts.find(a => a.id === id)) return res.status(403).json({ message: 'Not authorised' });
      if (req.body.isDefault) {
        for (const acc of accounts) {
          if (acc.isDefault && acc.id !== id) await storage.updateBankAccount(acc.id, { isDefault: false });
        }
      }
      const updated = await storage.updateBankAccount(id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'Failed to update bank account' });
    }
  });

  app.delete('/api/bank-accounts/:id', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const accounts = await storage.getBankAccounts(userId);
      if (!accounts.find(a => a.id === id)) return res.status(403).json({ message: 'Not authorised' });
      await storage.deleteBankAccount(id);
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ message: 'Failed to delete bank account' });
    }
  });

  // ─── Seller Payout Request Routes ───────────────────────────────────────────

  // Seller: create a payout request for a released escrow
  app.post('/api/payout-requests', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { escrowId, paymentMethod, walletId, bankAccountId, notes } = req.body;
      if (!escrowId) return res.status(400).json({ message: 'escrowId is required' });

      const escrow = await storage.getEscrow(escrowId);
      if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
      if (escrow.sellerId !== userId) return res.status(403).json({ message: 'Only the seller can request a payout' });
      if (!['RELEASED', 'DELIVERED'].includes(escrow.status ?? '')) {
        return res.status(400).json({ message: 'Payout can only be requested after escrow is delivered or released' });
      }

      // Check for existing pending/approved request
      const existing = await storage.getPayoutRequests({ sellerId: userId });
      const duplicate = existing.find(r => r.escrowId === escrowId && ['PENDING', 'APPROVED'].includes(r.status ?? ''));
      if (duplicate) return res.status(409).json({ message: 'A payout request already exists for this escrow' });

      const amount = escrow.sellerNetAmount ?? escrow.amount;
      const payout = await storage.createPayoutRequest({
        escrowId,
        sellerId: userId,
        amount: String(amount),
        currency: escrow.currency,
        paymentMethod: paymentMethod || 'bank',
        walletId: walletId || undefined,
        bankAccountId: bankAccountId || undefined,
        notes,
      } as any);

      // Notify admins
      try {
        const { db } = await import('./db');
        const { users: usersTable } = await import('@shared/schema');
        const { eq: eqOp } = await import('drizzle-orm');
        const admins = await db.select().from(usersTable).where(eqOp(usersTable.role, 'ADMIN'));
        const seller = await storage.getUser(userId);
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: 'ESCROW_UPDATE',
            data: {
              payoutRequestId: payout.id,
              escrowId,
              sellerUsername: seller?.username ?? 'a seller',
              amount: String(amount),
              currency: escrow.currency,
              message: `Seller ${seller?.username ?? ''} has requested a payout of ${amount} ${escrow.currency}. Please review.`,
              action: 'payout_request_submitted',
            },
          });
        }
      } catch (e) { console.warn('Could not notify admins of payout request:', e); }

      res.status(201).json(payout);
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'Failed to create payout request' });
    }
  });

  // Seller: view own payout requests
  app.get('/api/payout-requests', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getPayoutRequests({ sellerId: userId });
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ message: 'Failed to fetch payout requests' });
    }
  });

  // Admin: list all payout requests
  app.get('/api/admin/payout-requests', isAuthenticatedEnhanced, isAdmin, async (_req, res) => {
    try {
      const requests = await storage.getPayoutRequests();
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ message: 'Failed to fetch payout requests' });
    }
  });

  // Admin: approve / reject / mark paid
  app.patch('/api/admin/payout-requests/:id', isAuthenticatedEnhanced, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { id } = req.params;
      const { status, adminNote, txHash } = req.body;

      const existing = await storage.getPayoutRequest(id);
      if (!existing) return res.status(404).json({ message: 'Payout request not found' });

      const updateData: any = {
        status,
        adminNote,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      };
      if (status === 'PAID') updateData.paidAt = new Date();
      if (txHash) updateData.txHash = txHash;

      const updated = await storage.updatePayoutRequest(id, updateData);

      // Notify seller
      const statusMessages: Record<string, string> = {
        APPROVED: `Your payout request of ${existing.amount} ${existing.currency} has been approved. Payment is being processed.`,
        REJECTED: `Your payout request was not approved.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        PAID: `Your payout of ${existing.amount} ${existing.currency} has been completed!${txHash ? ` Transaction: ${txHash}` : ''}`,
      };
      if (statusMessages[status]) {
        await storage.createNotification({
          userId: existing.sellerId,
          type: 'ESCROW_UPDATE',
          data: {
            payoutRequestId: id,
            escrowId: existing.escrowId,
            message: statusMessages[status],
            action: `payout_${status.toLowerCase()}`,
          },
        });
      }

      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'Failed to update payout request' });
    }
  });

  // ─── Agent Available Shipments + Claim ──────────────────────────────────────

  // Agent: see all unassigned PENDING shipments (available to claim)
  app.get('/api/agent/available-shipments', isAuthenticatedEnhanced, isDeliveryAgent, async (_req, res) => {
    try {
      const available = await storage.getAvailableShipments();
      res.json(available);
    } catch (e: any) {
      res.status(500).json({ message: 'Failed to fetch available shipments' });
    }
  });

  // Agent: claim a shipment (self-assign)
  app.post('/api/agent/shipments/:id/claim', isAuthenticatedEnhanced, isDeliveryAgent, async (req: any, res) => {
    try {
      const agentId = req.user.claims.sub;
      const { id } = req.params;

      const existing = await storage.getShipment(id);
      if (!existing) return res.status(404).json({ message: 'Shipment not found' });
      if ((existing as any).agentId) return res.status(409).json({ message: 'This shipment has already been claimed' });

      const updated = await storage.claimShipment(id, agentId);

      // Notify seller that an agent has claimed the shipment
      const agentUser = await storage.getUser(agentId);
      const agentName = agentUser?.firstName ? `${agentUser.firstName} ${agentUser.lastName ?? ''}`.trim() : agentUser?.username ?? 'A delivery agent';
      await storage.createNotification({
        userId: existing.sellerId,
        type: 'ESCROW_UPDATE',
        data: {
          shipmentId: id,
          trackingNumber: existing.trackingNumber,
          agentName,
          message: `${agentName} has claimed your shipment ${existing.trackingNumber} for pickup.`,
          action: 'agent_claimed',
        },
      });
      // Notify admins
      try {
        const { db } = await import('./db');
        const { users: usersTable } = await import('@shared/schema');
        const { eq: eqOp } = await import('drizzle-orm');
        const admins = await db.select().from(usersTable).where(eqOp(usersTable.role, 'ADMIN'));
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: 'ESCROW_UPDATE',
            data: { shipmentId: id, trackingNumber: existing.trackingNumber, agentName, message: `Agent ${agentName} self-assigned shipment ${existing.trackingNumber}.`, action: 'agent_self_assigned' },
          });
        }
      } catch (e) { /* non-critical */ }

      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || 'Failed to claim shipment' });
    }
  });

  // ─── Shipping Agent Public Signup ────────────────────────────────────────────

  // Public: register as a shipping/delivery agent (individual or company)
  app.post('/api/auth/signup/agent', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, username, agentType, companyName, whatsapp, location } = req.body;
      if (!email || !password || !username || !agentType) {
        return res.status(400).json({ message: 'email, password, username, and agentType are required' });
      }
      if (!['INDIVIDUAL', 'COMPANY'].includes(agentType)) {
        return res.status(400).json({ message: 'agentType must be INDIVIDUAL or COMPANY' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(400).json({ message: 'An account with this email already exists' });
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) return res.status(400).json({ message: 'Username is already taken' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        firstName: firstName || companyName || username,
        lastName: lastName || '',
        username,
        passwordHash,
        accountType: 'BOTH',
        role: 'DELIVERY_AGENT',
        agentType,
        companyName: agentType === 'COMPANY' ? companyName : undefined,
        whatsapp: whatsapp || null,
        location: location || null,
      });

      const { passwordHash: _, ...publicUser } = user;

      // Set session — use regenerate() to avoid session fixation, then save explicitly.
      // Session failure is non-fatal: user was created and can log in manually.
      await new Promise<void>((resolve) => {
        req.session.regenerate((regenErr: any) => {
          if (regenErr) {
            console.error('[agent-signup] session.regenerate error (non-fatal):', regenErr);
            return resolve();
          }
          req.session.userId = user.id;
          req.session.isCustomAuth = true;
          req.session.save((saveErr: any) => {
            if (saveErr) console.error('[agent-signup] session.save error (non-fatal):', saveErr);
            resolve();
          });
        });
      });

      res.status(201).json(publicUser);
    } catch (error: any) {
      console.error('Agent signup error:', error);
      const msg: string = error?.message || '';
      if (msg.includes('unique') || msg.includes('duplicate') || error?.code === '23505') {
        if (msg.includes('email')) return res.status(400).json({ message: 'An account with this email already exists' });
        if (msg.includes('username')) return res.status(400).json({ message: 'Username is already taken' });
        return res.status(400).json({ message: 'Account already exists with this email or username' });
      }
      res.status(500).json({ message: `Failed to create agent account: ${msg || 'unknown error'}` });
    }
  });

  // Health check — used by Railway to verify the app is alive
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = existingServer ?? createServer(app);

  return httpServer;
}
