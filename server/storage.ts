import {
  users,
  wallets,
  listings,
  reviews,
  escrows,
  follows,
  messages,
  notifications,
  blogPosts,
  platformWallets,
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
  type InsertMessage,
  type Message,
  type InsertNotification,
  type Notification,
  type InsertBlogPost,
  type BlogPost,
  type InsertPlatformWallet,
  type PlatformWallet,
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
  
  // Message operations
  getMessages(threadId: string): Promise<(Message & { sender: User; recipient: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  getUserThreads(userId: string): Promise<{ threadId: string; otherUser: User; lastMessage: Message; unreadCount: number }[]>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Blog operations
  getBlogPosts(published?: boolean): Promise<(BlogPost & { author: User })[]>;
  getBlogPost(slug: string): Promise<(BlogPost & { author: User }) | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  
  // Platform wallet operations
  getPlatformWallets(): Promise<PlatformWallet[]>;
  createPlatformWallet(wallet: InsertPlatformWallet): Promise<PlatformWallet>;
  updatePlatformWallet(id: string, wallet: Partial<InsertPlatformWallet>): Promise<PlatformWallet>;
  deletePlatformWallet(id: string): Promise<void>;
  getPlatformWalletByType(type: string): Promise<PlatformWallet | undefined>;
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
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        passwordHash: hashedPassword,
      })
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
        seller: users,
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
      ));
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
    const buyerUsers = db.select().from(users).as('buyerUsers');
    const sellerUsers = db.select().from(users).as('sellerUsers');
    
    let baseQuery = db
      .select({
        escrow: escrows,
        listing: listings,
        buyer: buyerUsers,
        seller: sellerUsers,
      })
      .from(escrows)
      .leftJoin(listings, eq(escrows.listingId, listings.id))
      .leftJoin(buyerUsers, eq(escrows.buyerId, buyerUsers.id))
      .leftJoin(sellerUsers, eq(escrows.sellerId, sellerUsers.id));

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

    let query = baseQuery;
    if (conditions.length > 0) {
      query = baseQuery.where(and(...conditions));
    }

    const results = await query.orderBy(desc(escrows.createdAt));
    
    return results.map(r => ({
      ...r.escrow,
      listing: r.listing!,
      buyer: r.buyer!,
      seller: r.seller!,
    }));
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
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        sender: users,
        recipient: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(users, eq(messages.recipientId, users.id))
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id));
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

  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost> {
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
}

export const storage = new DatabaseStorage();
