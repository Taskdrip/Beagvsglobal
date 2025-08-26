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
export const accountTypeEnum = pgEnum('account_type', ['BUYER', 'SELLER', 'BOTH']);
export const walletTypeEnum = pgEnum('wallet_type', ['PI', 'USDT_TRON', 'USDT_TON', 'USDT_BNB', 'USDT_SOL', 'USDT_AVAX']);
export const listingTypeEnum = pgEnum('listing_type', ['REAL_ESTATE', 'SHIPPING_SERVICE', 'PRODUCT', 'SERVICE']);
export const currencyEnum = pgEnum('currency', ['PI', 'USDT', 'USD', 'NGN', 'EUR', 'GBP', 'CAD']);
export const networkEnum = pgEnum('network', ['PI_MAINNET', 'TRON', 'TON', 'BNB', 'SOL', 'AVAX', 'BANK_TRANSFER']);
export const escrowStatusEnum = pgEnum('escrow_status', ['CREATED', 'FUNDED', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'RELEASED', 'REFUNDED']);
export const followStatusEnum = pgEnum('follow_status', ['PENDING', 'ACCEPTED', 'REJECTED']);
export const notificationTypeEnum = pgEnum('notification_type', ['FOLLOW_REQUEST', 'MESSAGE', 'ESCROW_UPDATE', 'REVIEW', 'KYC_STATUS']);
export const kycStatusEnum = pgEnum('kyc_status', ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']);
export const documentTypeEnum = pgEnum('document_type', ['DRIVERS_LICENSE', 'INTERNATIONAL_PASSPORT', 'NATIONAL_ID', 'VOTER_ID']);
export const verificationTypeEnum = pgEnum('verification_type', ['FACIAL', 'DOCUMENT']);

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
  accountType: accountTypeEnum("account_type").default('BUYER'),
  // KYC fields
  kycStatus: kycStatusEnum("kyc_status").default('NOT_STARTED'),
  kycSubmittedAt: timestamp("kyc_submitted_at"),
  kycApprovedAt: timestamp("kyc_approved_at"),
  kycRejectedAt: timestamp("kyc_rejected_at"),
  kycRejectionReason: text("kyc_rejection_reason"),
  kycNotes: text("kyc_notes"),
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

export const chatThreads = pgTable("chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: 'cascade' }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  escrowId: varchar("escrow_id").references(() => escrows.id, { onDelete: 'set null' }),
  status: varchar("status").default('active'), // active, archived, closed
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  messageType: varchar("message_type").default('text'), // text, system, escrow_update
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

// Payment methods that admin can configure
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Bank Transfer", "PI Network", "USDT Tron", etc.
  type: varchar("type").notNull(), // "BANK_TRANSFER", "CRYPTO"
  currency: varchar("currency"), // "USDT", "PI", "USD", etc.
  network: varchar("network"), // "TRON", "TON", "BNB", "SOL", "AVAX", etc.
  details: jsonb("details").notNull(), // Bank details or wallet addresses
  isActive: boolean("is_active").default(true),
  instructions: text("instructions"), // Payment instructions for users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KYC Verification table - stores verification attempts and results
export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  verificationType: verificationTypeEnum("verification_type").notNull(),
  status: kycStatusEnum("status").default('PENDING'),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  metadata: jsonb("metadata"), // Store additional verification data like confidence scores
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KYC Documents table - stores uploaded documents
export const kycDocuments = pgTable("kyc_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  verificationId: varchar("verification_id").notNull().references(() => kycVerifications.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum("document_type").notNull(),
  country: varchar("country").notNull(),
  documentNumber: varchar("document_number"),
  expiryDate: timestamp("expiry_date"),
  fileUrl: varchar("file_url").notNull(), // Object storage URL
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  isDeleted: boolean("is_deleted").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Facial verification data
export const facialVerifications = pgTable("facial_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  verificationId: varchar("verification_id").notNull().references(() => kycVerifications.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url").notNull(), // Object storage URL for facial image
  livenessScore: decimal("liveness_score", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }), // AI confidence score
  biometricHash: varchar("biometric_hash"), // Encrypted biometric template
  verificationData: jsonb("verification_data"), // Additional verification metadata
  createdAt: timestamp("created_at").defaultNow(),
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
  buyerChatThreads: many(chatThreads, { relationName: "buyerChatThreads" }),
  sellerChatThreads: many(chatThreads, { relationName: "sellerChatThreads" }),
  notifications: many(notifications),
  blogPosts: many(blogPosts),
  kycVerifications: many(kycVerifications),
  kycDocuments: many(kycDocuments),
  facialVerifications: many(facialVerifications),
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

export const chatThreadRelations = relations(chatThreads, ({ one, many }) => ({
  listing: one(listings, {
    fields: [chatThreads.listingId],
    references: [listings.id],
  }),
  buyer: one(users, {
    fields: [chatThreads.buyerId],
    references: [users.id],
    relationName: "buyerChatThreads",
  }),
  seller: one(users, {
    fields: [chatThreads.sellerId],
    references: [users.id],
    relationName: "sellerChatThreads",
  }),
  escrow: one(escrows, {
    fields: [chatThreads.escrowId],
    references: [escrows.id],
  }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [messages.threadId],
    references: [chatThreads.id],
  }),
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

export const kycVerificationRelations = relations(kycVerifications, ({ one, many }) => ({
  user: one(users, {
    fields: [kycVerifications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [kycVerifications.reviewedBy],
    references: [users.id],
  }),
  documents: many(kycDocuments),
  facialVerification: many(facialVerifications),
}));

export const kycDocumentRelations = relations(kycDocuments, ({ one }) => ({
  verification: one(kycVerifications, {
    fields: [kycDocuments.verificationId],
    references: [kycVerifications.id],
  }),
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
  }),
}));

export const facialVerificationRelations = relations(facialVerifications, ({ one }) => ({
  verification: one(kycVerifications, {
    fields: [facialVerifications.verificationId],
    references: [kycVerifications.id],
  }),
  user: one(users, {
    fields: [facialVerifications.userId],
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

export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
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

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertFacialVerificationSchema = createInsertSchema(facialVerifications).omit({
  id: true,
  createdAt: true,
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
export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertPlatformWallet = z.infer<typeof insertPlatformWalletSchema>;
export type PlatformWallet = typeof platformWallets.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertFacialVerification = z.infer<typeof insertFacialVerificationSchema>;
export type FacialVerification = typeof facialVerifications.$inferSelect;
