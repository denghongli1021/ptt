import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

export default function PostPage() {
  const { user, isAuthenticated } = useAuth();
  const { postId } = useParams<{ postId: string }>();
  const [commentContent, setCommentContent] = useState("");
  const [commentType, setCommentType] = useState<"push" | "booh" | "neutral">("push");

  // 獲取貼文詳情
  const { data: post, isLoading: postLoading, refetch } = trpc.posts.getById.useQuery(
    { id: parseInt(postId || "0") },
    { enabled: !!postId }
  );

  // 建立推文
  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      setCommentType("push");
      refetch();
    },
  });

  const handleCreateComment = async () => {
    if (!post || !commentContent.trim()) return;

    await createCommentMutation.mutateAsync({
      postId: post.id,
      content: commentContent,
      type: commentType,
    });
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-accent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">貼文不存在</p>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Post Header */}
        <div className="bg-card border border-border rounded p-4 mb-6">
          <h1 className="text-2xl font-bold text-accent mb-2">{post.title}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
            <span>作者: {post.author?.name || "Unknown"}</span>
            <span>時間: {new Date(post.createdAt).toLocaleString()}</span>
            <span>推: {post.pushCount} 噓: {post.boohCount}</span>
          </div>
          <div className="ptt-text whitespace-pre-wrap">{post.content}</div>
        </div>

        {/* Comments Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-accent mb-4">推文 ({post.commentCount})</h2>
          <div className="space-y-px bg-border">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className={`bg-background p-3 border-b border-border ptt-comment-line`}>
                  <div className={`ptt-comment-type ${
                    comment.type === "push" ? "ptt-push" :
                    comment.type === "booh" ? "ptt-booh" :
                    "ptt-neutral"
                  }`}>
                    {comment.type === "push" ? "推" : comment.type === "booh" ? "噓" : "→"}
                  </div>
                  <div className="flex-1">
                    <div className="ptt-comment-content">
                      <span className="font-semibold">{comment.author?.name || "Unknown"}</span>
                      <span className="text-muted-foreground ml-2">{comment.content}</span>
                    </div>
                    <div className="ptt-comment-meta text-xs mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-background p-4 text-center text-muted-foreground">
                還沒有推文
              </div>
            )}
          </div>
        </div>

        {/* New Comment Form */}
        {isAuthenticated ? (
          <div className="bg-card border border-border rounded p-4">
            <h3 className="font-bold text-accent mb-4">發表推文</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value as "push" | "booh" | "neutral")}
                  className="bg-input border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="push">推</option>
                  <option value="booh">噓</option>
                  <option value="neutral">→</option>
                </select>
              </div>
              <textarea
                placeholder="推文內容..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCommentContent("");
                    setCommentType("push");
                  }}
                >
                  清空
                </Button>
                <Button
                  onClick={handleCreateComment}
                  disabled={createCommentMutation.isPending || !commentContent.trim()}
                >
                  {createCommentMutation.isPending ? "發表中..." : "發表"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded p-4 text-center">
            <p className="text-muted-foreground mb-4">登入後才能推文</p>
            <a href={getLoginUrl()}>
              <Button>登入</Button>
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
