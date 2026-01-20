import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

export default function BoardPage() {
  const { user, isAuthenticated } = useAuth();
  const { boardName } = useParams<{ boardName: string }>();
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");

  // 獲取看板資訊
  const { data: board, isLoading: boardLoading } = trpc.boards.getByName.useQuery(
    { name: boardName || "" },
    { enabled: !!boardName }
  );

  // 獲取貼文列表
  const { data: posts, isLoading: postsLoading, refetch } = trpc.posts.listByBoard.useQuery(
    { boardId: board?.id || 0, limit: 20, offset: 0 },
    { enabled: !!board }
  );

  // 建立新貼文
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      setPostTitle("");
      setPostContent("");
      setShowNewPostForm(false);
      refetch();
    },
  });

  const handleCreatePost = async () => {
    if (!board || !postTitle.trim() || !postContent.trim()) return;

    await createPostMutation.mutateAsync({
      boardId: board.id,
      title: postTitle,
      content: postContent,
    });
  };

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
              <Button onClick={() => setShowNewPostForm(!showNewPostForm)} className="gap-2">
                <Plus className="w-4 h-4" />
                發文
              </Button>
            ) : (
              <a href={getLoginUrl()}>
                <Button>登入發文</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* New Post Form */}
      {showNewPostForm && isAuthenticated && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="標題"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <textarea
                placeholder="內容"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={6}
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewPostForm(false);
                    setPostTitle("");
                    setPostContent("");
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || !postTitle.trim() || !postContent.trim()}
                >
                  {createPostMutation.isPending ? "發文中..." : "發文"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
