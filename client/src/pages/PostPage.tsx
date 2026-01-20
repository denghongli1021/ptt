import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Edit2, Trash2, Bookmark } from "lucide-react";

export default function PostPage() {
  const { user, isAuthenticated } = useAuth();
  const { postId } = useParams<{ postId: string }>();
  const [, setLocation] = useLocation();
  const [commentContent, setCommentContent] = useState("");
  const [commentType, setCommentType] = useState<"push" | "booh" | "neutral">("push");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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

  // 編輯貼文
  const updatePostMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  // 刪除貼文
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(false);
      if (post?.boardId) {
        setLocation(`/board/${post.boardId}`);
      } else {
        setLocation("/");
      }
    },
  });

  // 收藏貼文
  const bookmarkMutation = trpc.bookmarks.create.useMutation({
    onSuccess: () => {
      setIsBookmarked(true);
    },
  });

  // 取消收藏
  const unbookmarkMutation = trpc.bookmarks.delete.useMutation({
    onSuccess: () => {
      setIsBookmarked(false);
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

  const handleStartEdit = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!post || !editTitle.trim() || !editContent.trim()) return;

    await updatePostMutation.mutateAsync({
      id: post.id,
      title: editTitle,
      content: editContent,
    });
  };

  const handleDelete = async () => {
    if (!post) return;
    await deletePostMutation.mutateAsync({ id: post.id });
  };

  const isAuthor = user && post && user.id === post.authorId;

  // 初始化收藏狀態
  useEffect(() => {
    if (post?.isBookmarked) {
      setIsBookmarked(post.isBookmarked);
    }
  }, [post?.isBookmarked]);

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
          {isEditing ? (
            // 編輯模式
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-2xl font-bold"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent ptt-text"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle("");
                    setEditContent("");
                  }}
                  disabled={updatePostMutation.isPending}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updatePostMutation.isPending || !editTitle.trim() || !editContent.trim()}
                >
                  {updatePostMutation.isPending ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          ) : (
            // 檢視模式
            <>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold text-accent flex-1">{post.title}</h1>
                <div className="flex gap-2">
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isBookmarked ? unbookmarkMutation.mutate({ postId: post.id }) : bookmarkMutation.mutate({ postId: post.id })}
                      disabled={bookmarkMutation.isPending || unbookmarkMutation.isPending}
                      className="gap-1"
                    >
                      <Bookmark className="w-4 h-4" />
                      {isBookmarked ? "已收藏" : "收藏"}
                    </Button>
                  )}
                  {isAuthor && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                        className="gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        編輯
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        刪除
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                <span>作者: {post.author?.name || "Unknown"}</span>
                <span>時間: {new Date(post.createdAt).toLocaleString()}</span>
                <span>推: {post.pushCount} 噓: {post.boohCount}</span>
              </div>
              <div className="ptt-text whitespace-pre-wrap">{post.content}</div>
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded p-6 max-w-sm">
              <h2 className="text-lg font-bold text-accent mb-4">確認刪除</h2>
              <p className="text-foreground mb-6">確定要刪除這篇貼文嗎？此操作無法復原。</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletePostMutation.isPending}
                >
                  取消
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deletePostMutation.isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deletePostMutation.isPending ? "刪除中..." : "確認刪除"}
                </Button>
              </div>
            </div>
          </div>
        )}

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
                      {comment.isEdited && <span className="text-xs text-muted-foreground ml-2">(已編輯)</span>}
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
