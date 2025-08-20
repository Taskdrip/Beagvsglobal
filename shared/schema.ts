import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  decimal,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const walletTypeEnum = pgEnum('wallet_type', ['PI', 'USDT_TRON', 'USDT_TON', 'USDT_BNB', 'USDT_SOL', 'USDT_AVAX']);
export const listingTypeEnum = pgEnum('listing_type', ['REAL_ESTATE', 'SHIPPING_SERVICE', 'PRODUCT', 'SERVICE']);
export const currencyEnum = pgEnum('currency', ['PI', 'USDT']);
export const networkEnum = pgEnum('network', ['PI_MAINNET', 'TRON', 'TON', 'BNB', 'SOL', 'AVAX']);
export const escrowStatusEnum = pgEnum('escrow_status', ['CREATED', 'FUNDED', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'RELEASED', 'REFUNDED']);
export const followStatusEnum = pgEnum('follow_status', ['PENDING', 'ACCEPTED', 'REJECTED']);
export const notificationTypeEnum = pgEnum('notification_type', ['FOLLOW_REQUEST', 'MESSAGE', 'ESCROW_UPDATE', 'REVIEW']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Additional fields for Beagvs Global
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  whatsapp: varchar("whatsapp"),
  address: text("address"),
  location: varchar("location"),
  bio: text("bio"),
  role: userRoleEnum("role").default('USER'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: walletTypeEnum("type").notNull(),
  address: varchar("address").notNull(),
  label: varchar("label"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: listingTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description").notNull(),
  priceCrypto: decimal("price_crypto", { precision: 18, scale: 8 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  network: networkEnum("network").notNull(),
  images: text("images").array().default([]),
  location: varchar("location"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: 'cascade' }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const escrows = pgTable("escrows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: 'cascade' }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  network: networkEnum("network").notNull(),
  status: escrowStatusEnum("status").default('CREATED'),
  buyerTxHash: varchar("buyer_tx_hash"),
  sellerTxHash: varchar("seller_tx_hash"),
  adminNote: text("admin_note"),
  platformFeePct: decimal("platform_fee_pct", { precision: 5, scale: 2 }).default('10.00'),
  platformFeeAmount: decimal("platform_fee_amount", { precision: 18, scale: 8 }),
  sellerNetAmount: decimal("seller_net_amount", { precision: 18, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followeeId: varchar("followee_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: followStatusEnum("status").default('PENDING'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  data: jsonb("data"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  excerpt: text("excerpt"),
  contentMarkdown: text("content_markdown").notNull(),
  coverImageUrl: varchar("cover_image_url"),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformWallets = pgTable("platform_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: walletTypeEnum("type").notNull(),
  address: varchar("address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  listings: many(listings),
  reviews: many(reviews),
  escrowsAsBuyer: many(escrows, { relationName: "buyerEscrows" }),
  escrowsAsSeller: many(escrows, { relationName: "sellerEscrows" }),
  followsAsFollower: many(follows, { relationName: "followerFollows" }),
  followsAsFollowee: many(follows, { relationName: "followeeFollows" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  notifications: many(notifications),
  blogPosts: many(blogPosts),
}));

export const walletRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const listingRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
  reviews: many(reviews),
  escrows: many(escrows),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
  }),
}));

export const escrowRelations = relations(escrows, ({ one }) => ({
  listing: one(listings, {
    fields: [escrows.listingId],
    references: [listings.id],
  }),
  buyer: one(users, {
    fields: [escrows.buyerId],
    references: [users.id],
    relationName: "buyerEscrows",
  }),
  seller: one(users, {
    fields: [escrows.sellerId],
    references: [users.id],
    relationName: "sellerEscrows",
  }),
}));

export const followRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "followerFollows",
  }),
  followee: one(users, {
    fields: [follows.followeeId],
    references: [users.id],
    relationName: "followeeFollows",
  }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const blogPostRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

// Schema types
export const upsertUserSchema = createInsertSchema(users);
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertEscrowSchema = createInsertSchema(escrows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformWalletSchema = createInsertSchema(platformWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Exported types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertEscrow = z.infer<typeof insertEscrowSchema>;
export type Escrow = typeof escrows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertPlatformWallet = z.infer<typeof insertPlatformWalletSchema>;
export type PlatformWallet = typeof platformWallets.$inferSelect;
