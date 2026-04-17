"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { useDashboard } from "../dashboard-context";
import { games } from "../data/mock-games";

const tags = Array.from(new Set(games.map((g) => g.tag)));

export default function GamesPage() {
  const { settings } = useDashboard();
  const { glowEffects } = settings;
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = games.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.desc.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || g.tag === activeTag;
    return matchesSearch && matchesTag;
  });

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
            <button
              key={game.name}
              className="cursor-pointer group relative overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 hover:ring-primary/30 text-left"
            >
              <div className="h-20 w-full opacity-60 group-hover:opacity-80 transition-opacity duration-300" style={{ background: game.gradient }} />
              <div className="absolute top-3 right-3 text-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">{game.emoji}</div>
              <div className="px-3.5 pb-3.5 pt-2.5">
                <p className="text-sm font-bold truncate" style={{ color: game.accent, textShadow: glowEffects ? `0 0 8px ${game.accent}60` : undefined }}>{game.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{game.desc}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full" style={{ color: game.accent, backgroundColor: `${game.accent}15` }}>{game.tag}</span>
                  <span className="text-[10px] text-muted-foreground">{game.players}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">No games found</p>
        )}
      </div>
    </main>
  );
}
