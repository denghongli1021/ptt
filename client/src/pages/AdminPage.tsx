import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"posts" | "users" | "boards">("posts");

  // 檢查是否為管理員
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">您沒有權限訪問此頁面</p>
        </div>
      </div>
    );
  }

  // 獲取所有貼文
  const { data: allPosts, isLoading: postsLoading } = trpc.admin.posts.useQuery({ limit: 100, offset: 0 });

  // 獲取所有使用者
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.users.useQuery({ limit: 100, offset: 0 });

  // 刪除貼文
  const deletePostMutation = trpc.admin.deletePost.useMutation({
    onSuccess: () => {
      // 重新獲取貼文列表
      window.location.reload();
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">← 返回</Button>
          </Link>
          <h1 className="text-2xl font-bold text-accent">管理員後台</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "posts"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            貼文管理
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            使用者管理
          </button>
          <button
            onClick={() => setActiveTab("boards")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "boards"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            看板管理
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div>
            <h2 className="text-xl font-bold text-accent mb-4">所有貼文</h2>
            {postsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-8 h-8 text-accent" />
              </div>
            ) : (
              <div className="space-y-2 bg-border">
                {allPosts && allPosts.length > 0 ? (
                  allPosts.map((post) => (
                    <div key={post.id} className="bg-card border border-border rounded p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-accent font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">作者ID: {post.authorId}</p>
                        <p className="text-sm text-muted-foreground">時間: {new Date(post.createdAt).toLocaleString()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePostMutation.mutate({ postId: post.id })}
                        disabled={deletePostMutation.isPending}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        刪除
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="bg-background p-8 text-center text-muted-foreground">
                    沒有貼文
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-xl font-bold text-accent mb-4">所有使用者</h2>
            {usersLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-8 h-8 text-accent" />
              </div>
            ) : (
              <div className="space-y-2">
                {allUsers && allUsers.length > 0 ? (
                  allUsers.map((u) => (
                    <div key={u.id} className="bg-card border border-border rounded p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-accent">{u.name}</p>
                          <p className="text-sm text-muted-foreground">Email: {u.email}</p>
                          <p className="text-sm text-muted-foreground">角色: {u.role}</p>
                          <p className="text-sm text-muted-foreground">加入時間: {new Date(u.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-background p-8 text-center text-muted-foreground">
                    沒有使用者
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Boards Tab */}
        {activeTab === "boards" && (
          <div>
            <h2 className="text-xl font-bold text-accent mb-4">看板管理</h2>
            <p className="text-muted-foreground mb-4">看板管理功能即將推出...</p>
          </div>
        )}
      </main>
    </div>
  );
}
