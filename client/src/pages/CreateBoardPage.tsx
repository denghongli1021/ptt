import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateBoardPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    category: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBoardMutation = trpc.boards.create.useMutation({
    onSuccess: (data) => {
      toast.success("看板建立成功！");
      setLocation(`/board/${data.name}`);
    },
    onError: (error) => {
      toast.error(`建立失敗: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.displayName.trim() || !formData.category.trim()) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBoardMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-accent mb-4">建立新看板</h1>
            <p className="text-muted-foreground mb-6">登入後才能建立看板</p>
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-accent mb-8">建立新看板</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border">
          <div>
            <label className="block text-sm font-medium mb-2">看板代稱 *</label>
            <Input
              placeholder="例如: Gossiping"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">英文字母和數字，用於 URL</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">看板名稱 *</label>
            <Input
              placeholder="例如: 八卦"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              disabled={isSubmitting}
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">分類 *</label>
            <Input
              placeholder="例如: 娛樂"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isSubmitting}
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">看板簡介</label>
            <Textarea
              placeholder="描述這個看板的主題和規則..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              rows={5}
              className="bg-background border-border"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "建立中..." : "建立看板"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
              disabled={isSubmitting}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-card border border-border rounded-lg">
          <h2 className="text-lg font-bold text-accent mb-4">看板建立提示</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 看板代稱必須是唯一的，建立後無法更改</li>
            <li>• 您將成為該看板的版主，可以管理看板內容</li>
            <li>• 看板簡介會顯示在看板列表中</li>
            <li>• 看板建立後可以邀請其他使用者成為版主</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
