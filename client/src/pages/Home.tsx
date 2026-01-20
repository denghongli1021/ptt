import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Link } from "wouter";
import { Loader2, Search } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: boards, isLoading } = trpc.boards.list.useQuery();
  const { data: searchResults } = trpc.boards.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const displayedBoards = searchQuery ? searchResults : boards;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-accent">批踢踢實業坊</h1>
            <span className="text-muted-foreground text-sm">PTT Clone</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm">{user?.name}</span>
                <Link href="/logout">
                  <Button variant="outline" size="sm">登出</Button>
                </Link>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm">登入</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋看板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-accent" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-px bg-border">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 bg-card p-3 font-bold text-sm border-b border-border">
                <div className="col-span-6">看板名稱</div>
                <div className="col-span-2">分類</div>
                <div className="col-span-2">人氣</div>
                <div className="col-span-2">簡介</div>
              </div>

              {/* Board List */}
              {displayedBoards && displayedBoards.length > 0 ? (
                displayedBoards.map((board) => (
                  <Link key={board.id} href={`/board/${board.name}`}>
                    <div className="grid grid-cols-12 gap-4 bg-background hover:bg-card p-3 text-sm border-b border-border cursor-pointer transition-colors">
                      <div className="col-span-6 text-accent font-semibold truncate">
                        {board.displayName}
                      </div>
                      <div className="col-span-2 text-muted-foreground truncate">
                        {board.category}
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {board.popularity}
                      </div>
                      <div className="col-span-2 text-muted-foreground truncate">
                        {board.description}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-12 bg-background p-8 text-center text-muted-foreground">
                  {searchQuery ? "未找到符合的看板" : "載入中..."}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
