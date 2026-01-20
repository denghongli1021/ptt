import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  getAllBoards,
  getBoardByName,
  searchBoards,
  getPostsByBoard,
  getPostById,
  createPost,
  searchPosts,
  getCommentsByPost,
  createComment,
  createCommentReaction,
  updatePost,
  deletePost,
  getDb,
} from "./db";
import { users } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 看板相關路由
  boards: router({
    // 獲取所有看板
    list: publicProcedure.query(async () => {
      return await getAllBoards();
    }),

    // 搜尋看板
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return await searchBoards(input.query);
      }),

    // 獲取特定看板
    getByName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await getBoardByName(input.name);
      }),
  }),

  // 貼文相關路由
  posts: router({
    // 獲取特定看板的貼文列表
    listByBoard: publicProcedure
      .input(z.object({
        boardId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await getPostsByBoard(input.boardId, input.limit, input.offset);
      }),

    // 獲取貼文詳情
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await getPostById(input.id);
        if (!post) return null;

        const db = await getDb();
        if (!db) return { ...post, author: null, comments: [] };

        // 獲取作者資訊
        const authorResult = await db.select().from(users).where(eq(users.id, post.authorId)).limit(1);
        const author = authorResult.length > 0 ? authorResult[0] : null;
        
        // 獲取推文列表
        const commentsList = await getCommentsByPost(post.id);
        
        // 為每個推文獲取作者資訊
        const commentsWithAuthor = await Promise.all(
          commentsList.map(async (comment) => {
            const commentAuthorResult = await db.select().from(users).where(eq(users.id, comment.authorId)).limit(1);
            const commentAuthor = commentAuthorResult.length > 0 ? commentAuthorResult[0] : null;
            return {
              ...comment,
              author: commentAuthor,
            };
          })
        );

        return {
          ...post,
          author,
          comments: commentsWithAuthor,
        };
      }),

    // 搜尋貼文
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return await searchPosts(input.query);
      }),

    // 建立新貼文（需要認證）
    create: protectedProcedure
      .input(z.object({
        boardId: z.number(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        return await createPost({
          boardId: input.boardId,
          title: input.title,
          content: input.content,
          authorId: ctx.user.id,
        });
      }),

    // 編輯貼文（需要認證）
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        const post = await getPostById(input.id);
        if (!post) throw new Error("Post not found");
        if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("You don't have permission to edit this post");
        }

        return await updatePost(input.id, {
          title: input.title,
          content: input.content,
        });
      }),

    // 刪除貼文（需要認證）
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        const post = await getPostById(input.id);
        if (!post) throw new Error("Post not found");
        if (post.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("You don't have permission to delete this post");
        }

        return await deletePost(input.id);
      }),
  }),

  // 推文相關路由
  comments: router({
    // 獲取特定貼文的推文列表
    listByPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        const comments = await getCommentsByPost(input.postId);
        const db = await getDb();
        
        if (!db) return comments.map(c => ({ ...c, author: null }));
        
        // 為每個推文獲取作者資訊
        const commentsWithAuthor = await Promise.all(
          comments.map(async (comment) => {
            const authorResult = await db.select().from(users).where(eq(users.id, comment.authorId)).limit(1);
            const author = authorResult.length > 0 ? authorResult[0] : null;
            return {
              ...comment,
              author,
            };
          })
        );
        
        return commentsWithAuthor;
      }),

    // 建立推文（需要認證）
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(500),
        type: z.enum(["push", "booh", "neutral"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        return await createComment({
          postId: input.postId,
          content: input.content,
          type: input.type,
          authorId: ctx.user.id,
        });
      }),

    // 對推文進行反應（需要認證）
    react: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        reaction: z.enum(["like", "dislike"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        return await createCommentReaction({
          commentId: input.commentId,
          userId: ctx.user.id,
          reaction: input.reaction,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
