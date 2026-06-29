import {
  users,
  wallets,
  listings,
  reviews,
  escrows,
  follows,
  chatThreads,
  messages,
  notifications,
  blogPosts,
  platformWallets,
  paymentMethods,
  platformSettings,
  shipments,
  shipmentEvents,
  aiSupportSessions,
  aiSupportMessages,
  type User,
  type UpsertUser,
  type InsertWallet,
  type Wallet,
  type InsertListing,
  type Listing,
  type InsertReview,
  type Review,
  type InsertEscrow,
  type Escrow,
  type InsertFollow,
  type Follow,
  type ChatThread,
  type InsertChatThread,
  type InsertMessage,
  type Message,
  type InsertNotification,
  type Notification,
  type InsertBlogPost,
  type BlogPost,
  type InsertPlatformWallet,
  type PlatformWallet,
  type InsertPaymentMethod,
  type PaymentMethod,
  type InsertShipment,
  type Shipment,
  type InsertShipmentEvent,
  type ShipmentEvent,
  type InsertPlatformSetting,
  type PlatformSetting,
  type AiSupportSession,
  type AiSupportMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  
  // Wallet operations
  getUserWallets(userId: string): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<void>;
  
  // Listing operations
  getListings(filters?: { type?: string; currency?: string; location?: string; search?: string }): Promise<(Listing & { seller: User; reviewCount: number; avgRating: number })[]>;
  getListing(id: string): Promise<(Listing & { seller: User; reviews: (Review & { reviewer: User })[] }) | undefined>;
  getListingBySlug(slug: string): Promise<(Listing & { seller: User; reviews: (Review & { reviewer: User })[] }) | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  getUserListings(userId: string): Promise<Listing[]>;
  
  // Review operations
  getListingReviews(listingId: string): Promise<(Review & { reviewer: User })[]>;
  createReview(review: InsertReview): Promise<Review>;
  canUserReview(userId: string, listingId: string): Promise<boolean>;
  
  // Escrow operations
  getEscrows(filters?: { status?: string; userId?: string }): Promise<(Escrow & { listing: Listing; buyer: User; seller: User })[]>;
  getEscrow(id: string): Promise<(Escrow & { listing: Listing; buyer: User; seller: User }) | undefined>;
  createEscrow(escrow: InsertEscrow): Promise<Escrow>;
  updateEscrow(id: string, escrow: Partial<InsertEscrow>): Promise<Escrow>;
  getUserEscrows(userId: string): Promise<(Escrow & { listing: Listing; buyer: User; seller: User })[]>;
  
  // Follow operations
  getFollowStatus(followerId: string, followeeId: string): Promise<Follow | undefined>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  updateFollow(id: string, status: string): Promise<Follow>;
  getUserFollowers(userId: string): Promise<(Follow & { follower: User })[]>;
  getUserFollowing(userId: string): Promise<(Follow & { followee: User })[]>;
  getFollowRequests(userId: string): Promise<(Follow & { follower: User })[]>;
  
  // Chat operations
  getChatThread(listingId: string, buyerId: string, sellerId: string): Promise<ChatThread | undefined>;
  createChatThread(thread: InsertChatThread): Promise<ChatThread>;
  getOrCreateChatThread(listingId: string, buyerId: string, sellerId: string, escrowId?: string): Promise<ChatThread>;
  getChatThreadMessages(threadId: string): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  getUserChatThreads(userId: string): Promise<(ChatThread & { listing: Listing; buyer: User; seller: User; lastMessage?: Message; unreadCount: number })[]>;
  getAllChatThreads(): Promise<(ChatThread & { listing: any; buyer: any; seller: any; unreadCount: number; lastMessage?: any })[]>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Blog operations
  getBlogPosts(published?: boolean): Promise<(BlogPost & { author: User })[]>;
  getBlogPost(slug: string): Promise<(BlogPost & { author: User }) | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<void>;
  
  // Platform wallet operations
  getPlatformWallets(): Promise<PlatformWallet[]>;
  createPlatformWallet(wallet: InsertPlatformWallet): Promise<PlatformWallet>;
  updatePlatformWallet(id: string, wallet: Partial<InsertPlatformWallet>): Promise<PlatformWallet>;
  deletePlatformWallet(id: string): Promise<void>;
  getPlatformWalletByType(type: string): Promise<PlatformWallet | undefined>;
  
  // Payment method operations (Admin only)
  getPaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, paymentMethod: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;
  getPaymentMethodsByType(type: string): Promise<PaymentMethod[]>;
  
  // KYC operations
  updateUserKycStatus(userId: string, status: string): Promise<User>;
  
  // Admin operations
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserAccountType(userId: string, accountType: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllEscrows(): Promise<(Escrow & { listing: Listing; buyer: User; seller: User })[]>;
  updateUserPassword(userId: string, passwordHash: string, mustChangePassword?: boolean): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  getAdminStats(): Promise<{ totalUsers: number; totalListings: number; totalEscrows: number; totalShipments: number }>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;

  // Shipment operations
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipment(id: string): Promise<(Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }) | undefined>;
  getShipmentByTrackingNumber(trackingNumber: string): Promise<(Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }) | undefined>;
  getShipmentByEscrowId(escrowId: string): Promise<(Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }) | undefined>;
  getShipmentsByUser(userId: string): Promise<(Shipment & { seller: User; buyer: User })[]>;
  updateShipment(id: string, data: Partial<InsertShipment>): Promise<Shipment>;
  addShipmentEvent(event: InsertShipmentEvent): Promise<ShipmentEvent>;
  getAllShipments(): Promise<(Shipment & { seller: User; buyer: User })[]>;

  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  getPlatformSetting(key: string): Promise<PlatformSetting | undefined>;
  upsertPlatformSetting(key: string, value: any, description?: string, updatedBy?: string): Promise<PlatformSetting>;
  deletePlatformSetting(key: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Wallet operations
  async getUserWallets(userId: string): Promise<Wallet[]> {
    return await db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async deleteWallet(id: string): Promise<void> {
    await db.delete(wallets).where(eq(wallets.id, id));
  }

  // Listing operations
  async getListings(filters?: { type?: string; currency?: string; location?: string; search?: string }) {
    let baseQuery = db
      .select({
        id: listings.id,
        sellerId: listings.sellerId,
        type: listings.type,
        title: listings.title,
        slug: listings.slug,
        description: listings.description,
        priceCrypto: listings.priceCrypto,
        currency: listings.currency,
        network: listings.network,
        images: listings.images,
        location: listings.location,
        isActive: listings.isActive,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        metadata: listings.metadata,
        seller: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          accountType: users.accountType,
          location: users.location,
          bio: users.bio,
          createdAt: users.createdAt,
        },
        reviewCount: sql<number>`COALESCE(COUNT(${reviews.id}), 0)`,
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(reviews, eq(listings.id, reviews.listingId))
      .groupBy(listings.id, users.id);

    const conditions = [eq(listings.isActive, true)];
    
    if (filters?.type) {
      conditions.push(eq(listings.type, filters.type as any));
    }
    if (filters?.currency) {
      conditions.push(eq(listings.currency, filters.currency as any));
    }
    if (filters?.location) {
      conditions.push(like(listings.location, `%${filters.location}%`));
    }
    if (filters?.search) {
      conditions.push(or(
        like(listings.title, `%${filters.search}%`),
        like(listings.description, `%${filters.search}%`)
      ) as any);
    }

    return await baseQuery
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt));
  }

  async getListing(id: string) {
    const [listing] = await db
      .select({
        listing: listings,
        seller: users,
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.id, id));

    if (!listing) return undefined;

    const reviewsData = await db
      .select({
        review: reviews,
        reviewer: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.listingId, id));

    return {
      ...listing.listing,
      seller: listing.seller!,
      reviews: reviewsData.map(r => ({ ...r.review, reviewer: r.reviewer! })),
    };
  }

  async getListingBySlug(slug: string) {
    const [listing] = await db
      .select({
        listing: listings,
        seller: users,
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.slug, slug));

    if (!listing) return undefined;

    const reviewsData = await db
      .select({
        review: reviews,
        reviewer: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.listingId, listing.listing.id));

    return {
      ...listing.listing,
      seller: listing.seller!,
      reviews: reviewsData.map(r => ({ ...r.review, reviewer: r.reviewer! })),
    };
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [newListing] = await db.insert(listings).values(listing).returning();
    return newListing;
  }

  async updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing> {
    const [updatedListing] = await db
      .update(listings)
      .set({ ...listing, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updatedListing;
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.sellerId, userId)).orderBy(desc(listings.createdAt));
  }

  // Review operations
  async getListingReviews(listingId: string) {
    return await db
      .select({
        id: reviews.id,
        listingId: reviews.listingId,
        reviewerId: reviews.reviewerId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewer: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.listingId, listingId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async canUserReview(userId: string, listingId: string): Promise<boolean> {
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(and(
        eq(escrows.buyerId, userId),
        eq(escrows.listingId, listingId),
        eq(escrows.status, 'RELEASED')
      ));
    
    if (!escrow) return false;

    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.reviewerId, userId),
        eq(reviews.listingId, listingId)
      ));

    return !existingReview;
  }

  // Escrow operations
  async getEscrows(filters?: { status?: string; userId?: string }) {
    // Use a simpler approach with separate queries to avoid stack overflow
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(escrows.status, filters.status as any));
    }

    if (filters?.userId) {
      conditions.push(or(
        eq(escrows.buyerId, filters.userId),
        eq(escrows.sellerId, filters.userId)
      ));
    }

    let escrowQuery = db.select().from(escrows);
    if (conditions.length > 0) {
      escrowQuery = escrowQuery.where(and(...conditions));
    }

    const escrowResults = await escrowQuery.orderBy(desc(escrows.createdAt));
    
    // Fetch related data separately to avoid circular references
    const results = [];
    for (const escrow of escrowResults) {
      const [listing] = await db.select().from(listings).where(eq(listings.id, escrow.listingId));
      const [buyer] = await db.select().from(users).where(eq(users.id, escrow.buyerId));
      const [seller] = await db.select().from(users).where(eq(users.id, escrow.sellerId));
      
      results.push({
        ...escrow,
        listing: listing!,
        buyer: buyer!,
        seller: seller!,
      });
    }
    
    return results;
  }

  async getEscrow(id: string) {
    const [result] = await db
      .select({
        escrow: escrows,
        listing: listings,
        buyer: users,
        seller: users,
      })
      .from(escrows)
      .leftJoin(listings, eq(escrows.listingId, listings.id))
      .leftJoin(users, eq(escrows.buyerId, users.id))
      .leftJoin(users, eq(escrows.sellerId, users.id))
      .where(eq(escrows.id, id));

    if (!result) return undefined;

    return {
      ...result.escrow,
      listing: result.listing!,
      buyer: result.buyer!,
      seller: result.seller!,
    };
  }

  async createEscrow(escrow: InsertEscrow): Promise<Escrow> {
    const [newEscrow] = await db.insert(escrows).values(escrow).returning();
    return newEscrow;
  }

  async updateEscrow(id: string, escrow: Partial<InsertEscrow>): Promise<Escrow> {
    const [updatedEscrow] = await db
      .update(escrows)
      .set({ ...escrow, updatedAt: new Date() })
      .where(eq(escrows.id, id))
      .returning();
    return updatedEscrow;
  }

  async getUserEscrows(userId: string) {
    return await this.getEscrows({ userId });
  }

  // Follow operations
  async getFollowStatus(followerId: string, followeeId: string): Promise<Follow | undefined> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followeeId, followeeId)
      ));
    return follow;
  }

  async createFollow(follow: InsertFollow): Promise<Follow> {
    const [newFollow] = await db.insert(follows).values(follow).returning();
    return newFollow;
  }

  async updateFollow(id: string, status: string): Promise<Follow> {
    const [updatedFollow] = await db
      .update(follows)
      .set({ status: status as any })
      .where(eq(follows.id, id))
      .returning();
    return updatedFollow;
  }

  async getUserFollowers(userId: string) {
    return await db
      .select({
        id: follows.id,
        followerId: follows.followerId,
        followeeId: follows.followeeId,
        status: follows.status,
        createdAt: follows.createdAt,
        follower: users,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(and(
        eq(follows.followeeId, userId),
        eq(follows.status, 'ACCEPTED')
      ));
  }

  async getUserFollowing(userId: string) {
    return await db
      .select({
        id: follows.id,
        followerId: follows.followerId,
        followeeId: follows.followeeId,
        status: follows.status,
        createdAt: follows.createdAt,
        followee: users,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followeeId, users.id))
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.status, 'ACCEPTED')
      ));
  }

  async getFollowRequests(userId: string) {
    return await db
      .select({
        id: follows.id,
        followerId: follows.followerId,
        followeeId: follows.followeeId,
        status: follows.status,
        createdAt: follows.createdAt,
        follower: users,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(and(
        eq(follows.followeeId, userId),
        eq(follows.status, 'PENDING')
      ));
  }

  // Message operations
  async getMessages(threadId: string) {
    return await db
      .select({
        id: messages.id,
        threadId: messages.threadId,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        messageType: messages.messageType,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          username: users.username,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async getUserThreads(userId: string) {
    // This is a simplified implementation - in production you'd want more efficient queries
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.recipientId, userId)
      ))
      .orderBy(desc(messages.createdAt));

    const threadsMap = new Map();
    
    for (const message of userMessages) {
      if (!threadsMap.has(message.threadId)) {
        const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
        
        const unreadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(and(
            eq(messages.threadId, message.threadId),
            eq(messages.recipientId, userId),
            sql`${messages.readAt} IS NULL`
          ));

        threadsMap.set(message.threadId, {
          threadId: message.threadId,
          otherUser,
          lastMessage: message,
          unreadCount: unreadCount[0]?.count || 0,
        });
      }
    }

    return Array.from(threadsMap.values());
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  // Blog operations
  async getBlogPosts(published?: boolean) {
    let baseQuery = db
      .select({
        blogPost: blogPosts,
        author: users,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id));

    let query = baseQuery;
    if (published !== undefined) {
      query = baseQuery.where(eq(blogPosts.published, published));
    }

    const results = await query.orderBy(desc(blogPosts.createdAt));
    
    return results.map(r => ({
      ...r.blogPost,
      author: r.author!,
    }));
  }

  async getBlogPost(slug: string) {
    const [result] = await db
      .select({
        blogPost: blogPosts,
        author: users,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.slug, slug));

    if (!result) return undefined;

    return {
      ...result.blogPost,
      author: result.author!,
    };
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // Platform wallet operations
  async getPlatformWallets(): Promise<PlatformWallet[]> {
    return await db.select().from(platformWallets).orderBy(platformWallets.type);
  }

  async createPlatformWallet(wallet: InsertPlatformWallet): Promise<PlatformWallet> {
    const [newWallet] = await db.insert(platformWallets).values(wallet).returning();
    return newWallet;
  }

  async updatePlatformWallet(id: string, wallet: Partial<InsertPlatformWallet>): Promise<PlatformWallet> {
    const [updatedWallet] = await db
      .update(platformWallets)
      .set({ ...wallet, updatedAt: new Date() })
      .where(eq(platformWallets.id, id))
      .returning();
    return updatedWallet;
  }

  async deletePlatformWallet(id: string): Promise<void> {
    await db.delete(platformWallets).where(eq(platformWallets.id, id));
  }

  async getPlatformWalletByType(type: string): Promise<PlatformWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(platformWallets)
      .where(eq(platformWallets.type, type as any));
    return wallet;
  }

  // Payment method operations (Admin only)
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(paymentMethods.name);
  }

  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newPaymentMethod] = await db.insert(paymentMethods).values(paymentMethod).returning();
    return newPaymentMethod;
  }

  async updatePaymentMethod(id: string, paymentMethod: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    const [updated] = await db
      .update(paymentMethods)
      .set({ ...paymentMethod, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updated;
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  async getPaymentMethodsByType(type: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.type, type))
      .orderBy(paymentMethods.name);
  }

  // Admin operations
  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserAccountType(userId: string, accountType: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ accountType: accountType as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllEscrows(): Promise<(Escrow & { listing: Listing; buyer: User; seller: User })[]> {
    return await this.getEscrows();
  }

  async updateUserPassword(userId: string, passwordHash: string, mustChangePassword: boolean = false): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const { id: _, createdAt: __, ...safeData } = data as any;
    const [updated] = await db
      .update(users)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getAdminStats(): Promise<{
    totalUsers: number; totalListings: number; totalEscrows: number; totalShipments: number;
    totalWallets: number; totalBlogPosts: number; totalReviews: number; totalMessages: number;
  }> {
    const [uCount] = await db.select({ count: count() }).from(users);
    const [lCount] = await db.select({ count: count() }).from(listings);
    const [eCount] = await db.select({ count: count() }).from(escrows);
    const [sCount] = await db.select({ count: count() }).from(shipments);
    const [wCount] = await db.select({ count: count() }).from(wallets);
    const [bCount] = await db.select({ count: count() }).from(blogPosts);
    const [rCount] = await db.select({ count: count() }).from(reviews);
    const [mCount] = await db.select({ count: count() }).from(messages);
    return {
      totalUsers: Number(uCount.count),
      totalListings: Number(lCount.count),
      totalEscrows: Number(eCount.count),
      totalShipments: Number(sCount.count),
      totalWallets: Number(wCount.count),
      totalBlogPosts: Number(bCount.count),
      totalReviews: Number(rCount.count),
      totalMessages: Number(mCount.count),
    };
  }

  // Chat operations
  async getChatThread(listingId: string, buyerId: string, sellerId: string): Promise<ChatThread | undefined> {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.listingId, listingId),
          eq(chatThreads.buyerId, buyerId),
          eq(chatThreads.sellerId, sellerId)
        )
      );
    return thread;
  }

  async createChatThread(thread: InsertChatThread): Promise<ChatThread> {
    const [newThread] = await db
      .insert(chatThreads)
      .values(thread)
      .returning();
    return newThread;
  }

  async getOrCreateChatThread(listingId: string, buyerId: string, sellerId: string, escrowId?: string): Promise<ChatThread> {
    const existingThread = await this.getChatThread(listingId, buyerId, sellerId);
    if (existingThread) {
      // Update escrow ID if provided and not set
      if (escrowId && !existingThread.escrowId) {
        const [updated] = await db
          .update(chatThreads)
          .set({ escrowId })
          .where(eq(chatThreads.id, existingThread.id))
          .returning();
        return updated;
      }
      return existingThread;
    }

    return this.createChatThread({
      listingId,
      buyerId,
      sellerId,
      escrowId,
    });
  }

  async getChatThreadMessages(threadId: string): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        id: messages.id,
        threadId: messages.threadId,
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        content: messages.content,
        messageType: messages.messageType,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          username: users.username,
          role: users.role,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Update thread's last message time
    await db
      .update(chatThreads)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatThreads.id, message.threadId));

    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id));
  }

  async getUserChatThreads(userId: string): Promise<(ChatThread & { listing: Listing; buyer: User; seller: User; lastMessage?: Message; unreadCount: number })[]> {
    const userThreads = await db
      .select({
        id: chatThreads.id,
        listingId: chatThreads.listingId,
        buyerId: chatThreads.buyerId,
        sellerId: chatThreads.sellerId,
        escrowId: chatThreads.escrowId,
        status: chatThreads.status,
        lastMessageAt: chatThreads.lastMessageAt,
        createdAt: chatThreads.createdAt,
        listing: {
          id: listings.id,
          title: listings.title,
          slug: listings.slug,
          type: listings.type,
          priceCrypto: listings.priceCrypto,
          currency: listings.currency,
        },
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          username: users.username,
        },
        seller: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          username: users.username,
        },
      })
      .from(chatThreads)
      .leftJoin(listings, eq(chatThreads.listingId, listings.id))
      .leftJoin(users, or(eq(chatThreads.buyerId, users.id), eq(chatThreads.sellerId, users.id)))
      .where(or(eq(chatThreads.buyerId, userId), eq(chatThreads.sellerId, userId)))
      .orderBy(desc(chatThreads.lastMessageAt));

    // Get unread counts and last messages for each thread
    const threadsWithData = await Promise.all(
      userThreads.map(async (thread) => {
        const [unreadCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.threadId, thread.id),
              eq(messages.recipientId, userId),
              sql`${messages.readAt} IS NULL`
            )
          );

        const [lastMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.threadId, thread.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...thread,
          unreadCount: unreadCount?.count || 0,
          lastMessage: lastMessage || undefined,
        };
      })
    );

    return threadsWithData as any;
  }

  async getAllChatThreads(): Promise<(ChatThread & { listing: any; buyer: any; seller: any; unreadCount: number; lastMessage?: any })[]> {
    const allThreads = await db
      .select({
        id: chatThreads.id,
        listingId: chatThreads.listingId,
        buyerId: chatThreads.buyerId,
        sellerId: chatThreads.sellerId,
        escrowId: chatThreads.escrowId,
        status: chatThreads.status,
        lastMessageAt: chatThreads.lastMessageAt,
        createdAt: chatThreads.createdAt,
      })
      .from(chatThreads)
      .orderBy(desc(chatThreads.lastMessageAt));

    const threadsWithData = await Promise.all(
      allThreads.map(async (thread) => {
        const [buyerRow] = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, username: users.username, role: users.role, profileImageUrl: users.profileImageUrl }).from(users).where(eq(users.id, thread.buyerId));
        const [sellerRow] = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, username: users.username, role: users.role, profileImageUrl: users.profileImageUrl }).from(users).where(eq(users.id, thread.sellerId));
        const [listingRow] = await db.select({ id: listings.id, title: listings.title, slug: listings.slug, type: listings.type }).from(listings).where(eq(listings.id, thread.listingId));
        const [lastMsg] = await db.select().from(messages).where(eq(messages.threadId, thread.id)).orderBy(desc(messages.createdAt)).limit(1);
        const [unreadRow] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.threadId, thread.id), sql`${messages.readAt} IS NULL`));
        return { ...thread, buyer: buyerRow, seller: sellerRow, listing: listingRow, lastMessage: lastMsg, unreadCount: unreadRow?.count || 0 };
      })
    );
    return threadsWithData as any;
  }

  // KYC operations
  async updateUserKycStatus(userId: string, status: string): Promise<User> {
    const now = new Date().toISOString();
    const updateData: any = { 
      kycStatus: status as any,
      kycSubmittedAt: status === 'UNDER_REVIEW' ? now : undefined,
      kycApprovedAt: status === 'APPROVED' ? now : undefined,
      kycRejectedAt: status === 'REJECTED' ? now : undefined,
    };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Shipment operations
  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const [s] = await db.insert(shipments).values(shipment).returning();
    return s;
  }

  private async _enrichShipment(shipment: Shipment): Promise<Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }> {
    const [seller] = await db.select().from(users).where(eq(users.id, shipment.sellerId));
    const [buyer] = await db.select().from(users).where(eq(users.id, shipment.buyerId));
    const events = await db
      .select()
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipment.id))
      .orderBy(desc(shipmentEvents.eventTimestamp));
    return { ...shipment, seller, buyer, events };
  }

  async getShipment(id: string): Promise<(Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }) | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    if (!shipment) return undefined;
    return this._enrichShipment(shipment);
  }

  async getShipmentByTrackingNumber(trackingNumber: string): Promise<(Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }) | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.trackingNumber, trackingNumber));
    if (!shipment) return undefined;
    return this._enrichShipment(shipment);
  }

  async getShipmentByEscrowId(escrowId: string): Promise<(Shipment & { seller: User; buyer: User; events: ShipmentEvent[] }) | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.escrowId, escrowId));
    if (!shipment) return undefined;
    return this._enrichShipment(shipment);
  }

  async getShipmentsByUser(userId: string): Promise<(Shipment & { seller: User; buyer: User })[]> {
    const rows = await db
      .select()
      .from(shipments)
      .where(or(eq(shipments.sellerId, userId), eq(shipments.buyerId, userId)))
      .orderBy(desc(shipments.createdAt));
    return Promise.all(rows.map(async (s) => {
      const [seller] = await db.select().from(users).where(eq(users.id, s.sellerId));
      const [buyer] = await db.select().from(users).where(eq(users.id, s.buyerId));
      return { ...s, seller, buyer };
    }));
  }

  async updateShipment(id: string, data: Partial<InsertShipment>): Promise<Shipment> {
    const [s] = await db
      .update(shipments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return s;
  }

  async addShipmentEvent(event: InsertShipmentEvent): Promise<ShipmentEvent> {
    const [e] = await db.insert(shipmentEvents).values(event).returning();
    return e;
  }

  async getAllShipments(): Promise<(Shipment & { seller: User; buyer: User })[]> {
    const rows = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
    return Promise.all(rows.map(async (s) => {
      const [seller] = await db.select().from(users).where(eq(users.id, s.sellerId));
      const [buyer] = await db.select().from(users).where(eq(users.id, s.buyerId));
      return { ...s, seller, buyer };
    }));
  }

  // Platform settings
  async getPlatformSettings(): Promise<PlatformSetting[]> {
    return db.select().from(platformSettings).orderBy(platformSettings.key);
  }

  async getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
    const [s] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return s;
  }

  async upsertPlatformSetting(key: string, value: any, description?: string, updatedBy?: string): Promise<PlatformSetting> {
    const [s] = await db
      .insert(platformSettings)
      .values({ key, value, description, updatedBy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value, description, updatedBy, updatedAt: new Date() },
      })
      .returning();
    return s;
  }

  async deletePlatformSetting(key: string): Promise<void> {
    await db.delete(platformSettings).where(eq(platformSettings.key, key));
  }

  // AI Support Chat operations
  async createAiSupportSession(data: { userId?: string; guestName?: string; guestEmail?: string }): Promise<AiSupportSession> {
    const [session] = await db.insert(aiSupportSessions).values({ ...data, status: 'open' }).returning();
    return session;
  }

  async getAiSupportSession(id: string): Promise<AiSupportSession | undefined> {
    const [session] = await db.select().from(aiSupportSessions).where(eq(aiSupportSessions.id, id));
    return session;
  }

  async updateAiSupportSession(id: string, data: Partial<AiSupportSession>): Promise<AiSupportSession> {
    const [session] = await db.update(aiSupportSessions).set({ ...data, updatedAt: new Date() }).where(eq(aiSupportSessions.id, id)).returning();
    return session;
  }

  async getAllAiSupportSessions(): Promise<(AiSupportSession & { user?: User; messageCount: number })[]> {
    const sessions = await db.select().from(aiSupportSessions).orderBy(desc(aiSupportSessions.createdAt));
    const result = await Promise.all(sessions.map(async (s) => {
      const user = s.userId ? await this.getUser(s.userId) : undefined;
      const [{ count: messageCount }] = await db.select({ count: count() }).from(aiSupportMessages).where(eq(aiSupportMessages.sessionId, s.id));
      return { ...s, user, messageCount: Number(messageCount) };
    }));
    return result;
  }

  async getAiSupportMessages(sessionId: string): Promise<AiSupportMessage[]> {
    return db.select().from(aiSupportMessages).where(eq(aiSupportMessages.sessionId, sessionId)).orderBy(aiSupportMessages.createdAt);
  }

  async createAiSupportMessage(data: { sessionId: string; role: string; content: string; senderName?: string }): Promise<AiSupportMessage> {
    const [msg] = await db.insert(aiSupportMessages).values(data).returning();
    await db.update(aiSupportSessions).set({ updatedAt: new Date() }).where(eq(aiSupportSessions.id, data.sessionId));
    return msg;
  }
}

export const storage = new DatabaseStorage();
