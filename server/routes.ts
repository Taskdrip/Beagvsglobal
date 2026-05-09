import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertListingSchema, insertEscrowSchema, insertReviewSchema, insertWalletSchema, insertFollowSchema, insertChatThreadSchema, insertMessageSchema, insertBlogPostSchema, insertPlatformWalletSchema, insertPaymentMethodSchema, insertKycVerificationSchema, insertKycDocumentSchema, insertFacialVerificationSchema } from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
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

      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.isCustomAuth = true;

      // Remove sensitive data
      const { passwordHash: _, ...publicUser } = user;
      res.status(201).json(publicUser);
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.isCustomAuth = true;

      // Remove sensitive data
      const { passwordHash: _, ...publicUser } = user;
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

  // User login (for non-Replit auth flow)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd create a session or JWT here
      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
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

  app.post('/api/listings', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingData = insertListingSchema.parse({
        ...req.body,
        sellerId: userId,
        slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
      });
      
      const listing = await storage.createListing(listingData);
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
      const escrowData = insertEscrowSchema.parse({ ...req.body, buyerId: userId });
      
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
      const escrowData = insertEscrowSchema.partial().parse(req.body);
      
      // Calculate fees if status is being updated to RELEASED
      if (escrowData.status === 'RELEASED') {
        const escrow = await storage.getEscrow(req.params.id);
        if (escrow) {
          const platformFeeAmount = Number(escrow.amount) * (Number(escrow.platformFeePct) / 100);
          const sellerNetAmount = Number(escrow.amount) - platformFeeAmount;
          
          escrowData.platformFeeAmount = platformFeeAmount.toString();
          escrowData.sellerNetAmount = sellerNetAmount.toString();
        }
      }
      
      const escrow = await storage.updateEscrow(req.params.id, escrowData);
      res.json(escrow);
    } catch (error: any) {
      console.error("Error updating escrow:", error);
      res.status(400).json({ message: error.message || "Failed to update escrow" });
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
      res.json(follow);
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
      
      const postData = insertBlogPostSchema.partial().parse(req.body);
      const post = await storage.updateBlogPost(req.params.id, postData);
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
      
      // Don't return sensitive information
      const { passwordHash, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.post('/api/kyc/facial-upload-url', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getFacialVerificationUploadURL(userId);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating facial upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post('/api/kyc/document-upload-url', isAuthenticatedEnhanced, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documentType } = req.body;
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getKycDocumentUploadURL(userId, documentType);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating document upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
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

  const httpServer = createServer(app);

  return httpServer;
}
