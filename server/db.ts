import { eq, desc, sql, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, boards, posts, comments, commentReactions, bookmarks } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 看板相關查詢
export async function getAllBoards() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(boards).orderBy(desc(boards.popularity));
}

export async function getBoardByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(boards).where(eq(boards.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchBoards(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(boards).where(
    like(boards.displayName, `%${query}%`)
  ).limit(20);
}

// 貼文相關查詢
export async function getPostsByBoard(boardId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(posts)
    .where(eq(posts.boardId, boardId))
    .orderBy(desc(posts.isPinned), desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPost(data: {
  boardId: number;
  title: string;
  content: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(posts).values({
    boardId: data.boardId,
    title: data.title,
    content: data.content,
    authorId: data.authorId,
  });
  
  // 獲取剛建立的貼文
  const createdPost = await db.select().from(posts)
    .orderBy(desc(posts.id))
    .limit(1);
  
  return createdPost[0] || result;
}

export async function searchPosts(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(posts).where(
    like(posts.title, `%${query}%`)
  ).orderBy(desc(posts.createdAt)).limit(limit);
}

// 推文相關查詢
export async function getCommentsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
}

export async function createComment(data: {
  postId: number;
  content: string;
  type: "push" | "booh" | "neutral";
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(comments).values({
    postId: data.postId,
    content: data.content,
    type: data.type,
    authorId: data.authorId,
  });
  
  // 更新貼文的推文計數
  const post = await getPostById(Number(data.postId));
  if (post) {
    const commentCount = await db.select({ count: sql`COUNT(*)` })
      .from(comments)
      .where(eq(comments.postId, data.postId));
    
    const pushCount = await db.select({ count: sql`COUNT(*)` })
      .from(comments)
      .where(and(eq(comments.postId, data.postId), eq(comments.type, "push")));
    
    const boohCount = await db.select({ count: sql`COUNT(*)` })
      .from(comments)
      .where(and(eq(comments.postId, data.postId), eq(comments.type, "booh")));
    
    await db.update(posts).set({
      commentCount: Number(commentCount[0]?.count || 0),
      pushCount: Number(pushCount[0]?.count || 0),
      boohCount: Number(boohCount[0]?.count || 0),
    }).where(eq(posts.id, data.postId));
  }
  
  return result;
}

// 推文互動相關查詢
export async function createCommentReaction(data: {
  commentId: number;
  userId: number;
  reaction: "like" | "dislike";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(commentReactions).values({
    commentId: data.commentId,
    userId: data.userId,
    reaction: data.reaction,
  });
}


// 編輯貼文
export async function updatePost(postId: number, data: {
  title?: string;
  content?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }
  
  return await db.update(posts).set(updateData).where(eq(posts.id, postId));
}

// 刪除貼文
export async function deletePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 先刪除所有推文
  await db.delete(comments).where(eq(comments.postId, postId));
  
  // 然後刪除貼文
  return await db.delete(posts).where(eq(posts.id, postId));
}

// 編輯推文
export async function updateComment(commentId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(comments).set({
    content,
    isEdited: 1,
  }).where(eq(comments.id, commentId));
}

// 刪除推文
export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(comments).where(eq(comments.id, commentId));
}

// 建立收藏
export async function createBookmark(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 檢查是否已收藏
  const existing = await db.select().from(bookmarks).where(
    eq(bookmarks.userId, userId) && eq(bookmarks.postId, postId)
  ).limit(1);
  
  if (existing.length > 0) {
    throw new Error("Already bookmarked");
  }
  
  return await db.insert(bookmarks).values({
    userId,
    postId,
  });
}

// 刪除收藏
export async function deleteBookmark(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(bookmarks).where(
    eq(bookmarks.userId, userId) && eq(bookmarks.postId, postId)
  );
}

// 獲取使用者的收藏列表
export async function getUserBookmarks(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const bookmarkList = await db.select().from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit)
    .offset(offset);
  
  // 獲取每個收藏的貼文詳情
  const postsWithDetails = await Promise.all(
    bookmarkList.map(async (bookmark) => {
      const post = await getPostById(Number(bookmark.postId));
      return post;
    })
  );
  
  return postsWithDetails.filter(p => p !== null);
}

// 檢查使用者是否收藏了某個貼文
export async function isPostBookmarked(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(bookmarks).where(
    eq(bookmarks.userId, userId) && eq(bookmarks.postId, postId)
  ).limit(1);
  
  return result.length > 0;
}

// 獲取所有貼文（用於管理員）
export async function getAllPosts(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

// 獲取所有使用者（用於管理員）
export async function getAllUsers(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

// 更新使用者角色（用於管理員）
export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users).set({ role }).where(eq(users.id, userId));
}


// 建立看板
export async function createBoard(data: {
  name: string;
  displayName: string;
  category: string;
  description?: string;
  moderatorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(boards).values({
    name: data.name,
    displayName: data.displayName,
    category: data.category,
    description: data.description || "",
    moderatorId: data.moderatorId,
  });
  
  // 獲取剛建立的看板
  const createdBoard = await db.select().from(boards)
    .where(eq(boards.name, data.name))
    .limit(1);
  
  return createdBoard[0] || result;
}

// 更新看板版主
export async function updateBoardModerator(boardId: number, moderatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(boards).set({
    moderatorId: moderatorId,
  }).where(eq(boards.id, boardId));
}

// 獲取使用者建立的看板
export async function getUserBoards(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(boards)
    .where(eq(boards.moderatorId, userId))
    .orderBy(desc(boards.createdAt));
}
