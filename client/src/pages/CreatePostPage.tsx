import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useParams, useLocation, Link } from "wouter";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function CreatePostPage() {
  const { user, isAuthenticated } = useAuth();
  const { boardName } = useParams<{ boardName: string }>();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 獲取看板資訊
  const { data: board } = trpc.boards.getByName.useQuery(
    { name: boardName || "" },
    { enabled: !!boardName }
  );

  // 建立貼文
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: (result) => {
      setIsSubmitting(false);
      // 重定向到新貼文
      if (result && "id" in result) {
        setLocation(`/post/${result.id}`);
      } else {
        setLocation(`/board/${boardName}`);
      }
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !board) return;

    setIsSubmitting(true);
    await createPostMutation.mutateAsync({
      boardId: board.id,
      title: title.trim(),
      content: content.trim(),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-accent mb-4">發表新貼文</h1>
            <p className="text-muted-foreground mb-6">登入後才能發表貼文</p>
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
          <Link href={`/board/${boardName}`}>
            <Button variant="outline" size="sm" className="mb-4">← 返回</Button>
          </Link>
          <h1 className="text-2xl font-bold text-accent">發表新貼文</h1>
          {board && <p className="text-muted-foreground text-sm">看板: {board.displayName}</p>}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded p-6">
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-semibold text-accent mb-2">標題</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="請輸入貼文標題..."
                maxLength={255}
                className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/255</p>
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-semibold text-accent mb-2">內容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="請輸入貼文內容..."
                rows={15}
                className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent ptt-text"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">支援換行和空格</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Link href={`/board/${boardName}`}>
                <Button variant="outline" disabled={isSubmitting}>
                  取消
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    發表中...
                  </>
                ) : (
                  "發表貼文"
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
