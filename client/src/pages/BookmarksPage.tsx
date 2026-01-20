import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function BookmarksPage() {
  const { user, isAuthenticated } = useAuth();

  // 獲取收藏列表
  const { data: bookmarks, isLoading } = trpc.bookmarks.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-accent mb-4">我的收藏</h1>
            <p className="text-muted-foreground mb-6">登入後才能查看收藏列表</p>
            <a href={getLoginUrl()}>
              <Button>登入</Button>
            </a>
          </div>
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
          <h1 className="text-2xl font-bold text-accent">我的收藏</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
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

            {/* Bookmarks List */}
            {bookmarks && bookmarks.length > 0 ? (
              bookmarks.filter(p => p !== null).map((post) => (
                <Link key={post!.id} href={`/post/${post!.id}`}>
                  <div className="grid grid-cols-12 gap-4 bg-background hover:bg-card p-3 text-sm border-b border-border cursor-pointer transition-colors">
                    <div className="col-span-6 text-accent truncate">
                      {post!.title}
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">
                      {post!.authorId}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {new Date(post!.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-accent">{post!.pushCount}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-destructive">{post!.boohCount}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-12 bg-background p-8 text-center text-muted-foreground">
                還沒有收藏任何貼文
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
