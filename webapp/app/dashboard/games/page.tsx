"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { useGames } from "@/hooks/use-games";
import { GameCard } from "../components/game-card";
import { GameDialog } from "../components/game-dialog";
import { GamesSkeleton } from "../components/ui/skeleton-primitives";
import type { Game } from "../types";

export default function GamesPage() {
  const { games, isLoading } = useGames();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<Game | null>(null);

  const tags = useMemo(() => Array.from(new Set(games.map((g) => g.tag))), [games]);

  const filtered = useMemo(
    () =>
      games.filter((g) => {
        const matchesSearch =
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.desc.toLowerCase().includes(search.toLowerCase());
        const matchesTag = !activeTag || g.tag === activeTag;
        return matchesSearch && matchesTag;
      }),
    [games, search, activeTag],
  );

  if (isLoading) {
    return (
      <main className="w-full min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-xl lg:max-w-3xl">
          <GamesSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl lg:max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
          </Link>
          <h1 className="text-lg font-semibold">All Games</h1>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} games</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 py-2 focus-within:ring-ring">
          <HugeiconsIcon icon={Search01Icon} size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`cursor-pointer text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-all duration-200 ring-1 ${
              !activeTag ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`cursor-pointer text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-all duration-200 ring-1 ${
                activeTag === tag ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((game) => (
            <GameCard key={game.name} game={game} size="large" onClick={() => setSelected(game)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">No games found</p>
        )}
      </div>

      {selected && (
        <GameDialog game={selected} open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
      )}
    </main>
  );
}
