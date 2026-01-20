import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 建立測試上下文
function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("boards router", () => {
  it("should list all boards", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const boards = await caller.boards.list();

    expect(Array.isArray(boards)).toBe(true);
  });

  it("should search boards by query", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.boards.search({ query: "test" });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should get board by name", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 先列出所有看板
    const boards = await caller.boards.list();
    
    if (boards.length > 0) {
      const board = await caller.boards.getByName({ name: boards[0].name });
      expect(board).toBeDefined();
      expect(board?.name).toBe(boards[0].name);
    }
  });
});
