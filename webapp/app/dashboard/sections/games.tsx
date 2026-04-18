"use client";

import { useState } from "react";
import { useDashboard } from "../dashboard-context";
import { useGames } from "@/hooks/use-games";
import { SectionHeader } from "../components/ui/section-header";
import { ScrollRow } from "../components/ui/scroll-row";
import { GameCard } from "../components/game-card";
import { GameDialog } from "../components/game-dialog";
import { GamesSkeleton } from "../components/ui/skeleton-primitives";
import type { Game } from "../types";

export function Games() {
  const { settings } = useDashboard();
  const { compactMode } = settings;
  const { games, isLoading } = useGames();
  const [selected, setSelected] = useState<Game | null>(null);

  if (isLoading) return <GamesSkeleton />;

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <SectionHeader title="Games" action="View All" href="/dashboard/games" />
      <ScrollRow>
        {games.map((game) => (
          <GameCard key={game.name} game={game} size={compactMode ? "compact" : "default"} onClick={() => setSelected(game)} />
        ))}
      </ScrollRow>
      {selected && (
        <GameDialog game={selected} open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
      )}
    </div>
  );
}
