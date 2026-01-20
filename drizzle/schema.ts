import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 看板表
export const boards = mysqlTable("boards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  description: text("description"),
  popularity: int("popularity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Board = typeof boards.$inferSelect;
export type InsertBoard = typeof boards.$inferInsert;

// 貼文表
export const posts = mysqlTable("posts", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  boardId: int("boardId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  pushCount: int("pushCount").default(0).notNull(),
  boohCount: int("boohCount").default(0).notNull(),
  isPinned: int("isPinned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// 推文表
export const comments = mysqlTable("comments", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  postId: bigint("postId", { mode: "number" }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["push", "booh", "neutral"]).notNull(),
  authorId: int("authorId").notNull(),
  isEdited: int("isEdited").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// 推文互動表（用於追蹤使用者對推文的反應）
export const commentReactions = mysqlTable("commentReactions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  commentId: bigint("commentId", { mode: "number" }).notNull(),
  userId: int("userId").notNull(),
  reaction: mysqlEnum("reaction", ["like", "dislike"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentReaction = typeof commentReactions.$inferSelect;
export type InsertCommentReaction = typeof commentReactions.$inferInsert;

// 收藏表
export const bookmarks = mysqlTable("bookmarks", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: bigint("postId", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// 關係定義
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  bookmarks: many(bookmarks),
}));

export const boardsRelations = relations(boards, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  board: one(boards, {
    fields: [posts.boardId],
    references: [boards.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  bookmarks: many(bookmarks),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  reactions: many(commentReactions),
}));

export const commentReactionsRelations = relations(commentReactions, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReactions.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentReactions.userId],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
}));
