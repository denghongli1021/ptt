import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useParams, Link } from "wouter";
import { Loader2, Plus } from "lucide-react";

export default function BoardPage() {
  const { user, isAuthenticated } = useAuth();
  const { boardName } = useParams<{ boardName: string }>();

  // 獲取看板資訊
  const { data: board, isLoading: boardLoading } = trpc.boards.getByName.useQuery(
    { name: boardName || "" },
    { enabled: !!boardName }
  );

  // 獲取貼文列表
  const { data: posts, isLoading: postsLoading } = trpc.posts.listByBoard.useQuery(
    { boardId: board?.id || 0, limit: 20, offset: 0 },
    { enabled: !!board }
  );

  if (boardLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-accent" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">看板不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">← 返回</Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-accent">{board.displayName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
            </div>
            {isAuthenticated ? (
              <Link href={`/board/${boardName}/create`}>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  發文
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button>登入發文</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {postsLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-accent" />
          </div>
        ) : (
          <div className="space-y-px bg-border">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 bg-card p-3 font-bold text-sm border-b border-border">
              <div className="col-span-6">標題</div>
              <div className="col-span-2">作者</div>
              <div className="col-span-2">日期</div>
              <div className="col-span-2">推文</div>
            </div>

            {/* Post List */}
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div className="grid grid-cols-12 gap-4 bg-background hover:bg-card p-3 text-sm border-b border-border cursor-pointer transition-colors">
                    <div className="col-span-6 text-accent truncate">
                      {post.title}
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">
                      {post.authorId}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-accent">{post.pushCount}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-destructive">{post.boohCount}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-12 bg-background p-8 text-center text-muted-foreground">
                此看板還沒有貼文
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
