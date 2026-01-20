import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 建立測試上下文
function createTestContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: `Test User ${userId}`,
      email: `user${userId}@test.com`,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("posts edit and delete", () => {
  it("should allow author to edit their own post", async () => {
    const ctx = createTestContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    // 先獲取看板列表
    const boards = await caller.boards.list();
    if (boards.length === 0) {
      console.log("No boards available for testing");
      return;
    }

    const boardId = boards[0].id;

    // 建立貼文
    const createResult = await caller.posts.create({
      boardId,
      title: "Test Post for Edit",
      content: "Original content",
    });

    expect(createResult).toBeDefined();

    // 編輯貼文
    const updateResult = await caller.posts.update({
      id: Number(createResult.insertId),
      title: "Updated Title",
      content: "Updated content",
    });

    expect(updateResult).toBeDefined();
  });

  it("should prevent non-author from editing post", async () => {
    const ctx1 = createTestContext(1, "user");
    const ctx2 = createTestContext(2, "user");
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // 使用者1建立貼文
    const boards = await caller1.boards.list();
    if (boards.length === 0) {
      console.log("No boards available for testing");
      return;
    }

    const boardId = boards[0].id;

    const createResult = await caller1.posts.create({
      boardId,
      title: "Test Post",
      content: "Content",
    });

    const postId = Number(createResult.insertId);

    // 使用者2嘗試編輯使用者1的貼文
    try {
      await caller2.posts.update({
        id: postId,
        title: "Hacked Title",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("permission");
    }
  });

  it("should allow author to delete their own post", async () => {
    const ctx = createTestContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    // 先獲取看板列表
    const boards = await caller.boards.list();
    if (boards.length === 0) {
      console.log("No boards available for testing");
      return;
    }

    const boardId = boards[0].id;

    // 建立貼文
    const createResult = await caller.posts.create({
      boardId,
      title: "Test Post for Delete",
      content: "Content to delete",
    });

    const postId = Number(createResult.insertId);

    // 刪除貼文
    const deleteResult = await caller.posts.delete({ id: postId });

    expect(deleteResult).toBeDefined();

    // 驗證貼文已刪除
    const getResult = await caller.posts.getById({ id: postId });
    expect(getResult).toBeNull();
  });

  it("should prevent non-author from deleting post", async () => {
    const ctx1 = createTestContext(1, "user");
    const ctx2 = createTestContext(2, "user");
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // 使用者1建立貼文
    const boards = await caller1.boards.list();
    if (boards.length === 0) {
      console.log("No boards available for testing");
      return;
    }

    const boardId = boards[0].id;

    const createResult = await caller1.posts.create({
      boardId,
      title: "Test Post",
      content: "Content",
    });

    const postId = Number(createResult.insertId);

    // 使用者2嘗試刪除使用者1的貼文
    try {
      await caller2.posts.delete({ id: postId });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("permission");
    }
  });

  it("should allow admin to edit any post", async () => {
    const ctx1 = createTestContext(1, "user");
    const ctxAdmin = createTestContext(999, "admin");
    const caller1 = appRouter.createCaller(ctx1);
    const callerAdmin = appRouter.createCaller(ctxAdmin);

    // 使用者1建立貼文
    const boards = await caller1.boards.list();
    if (boards.length === 0) {
      console.log("No boards available for testing");
      return;
    }

    const boardId = boards[0].id;

    const createResult = await caller1.posts.create({
      boardId,
      title: "Test Post",
      content: "Content",
    });

    const postId = Number(createResult.insertId);

    // 管理員編輯貼文
    const updateResult = await callerAdmin.posts.update({
      id: postId,
      title: "Admin Updated Title",
    });

    expect(updateResult).toBeDefined();
  });
});
