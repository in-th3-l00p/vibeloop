"use client";

import { useDashboard } from "../dashboard-context";
import { SectionHeader } from "../components/ui/section-header";
import { ScrollRow } from "../components/ui/scroll-row";
import { games } from "../data/mock-games";

export function Games() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;
  const cardW = compactMode ? "w-36" : "w-44";

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <SectionHeader title="Games" action="View All" href="/dashboard/games" />
      <ScrollRow>
        {games.map((game) => (
          <button
            key={game.name}
            className={`cursor-pointer group relative shrink-0 ${cardW} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 text-left`}
          >
            <div className={`${compactMode ? "h-10" : "h-14"} w-full opacity-60 group-hover:opacity-80 transition-opacity duration-300`} style={{ background: game.gradient }} />
            <div className="absolute top-2.5 right-3 text-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">{game.emoji}</div>
            <div className={compactMode ? "px-2.5 pb-2.5 pt-2" : "px-3.5 pb-3.5 pt-2.5"}>
              <p className="text-sm font-bold truncate" style={{ color: game.accent, textShadow: glowEffects ? `0 0 8px ${game.accent}60` : undefined }}>{game.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{game.desc}</p>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full" style={{ color: game.accent, backgroundColor: `${game.accent}15` }}>{game.tag}</span>
                <span className="text-[10px] text-muted-foreground">{game.players}</span>
              </div>
            </div>
          </button>
        ))}
      </ScrollRow>
    </div>
  );
}
