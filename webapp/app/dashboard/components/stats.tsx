"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ChartBarIncreasingIcon, Award01Icon, Target02Icon, Timer01Icon, Fire02Icon, GameController01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ActionButton } from "./ui/action-button";
import { StatsSkeleton } from "./ui/skeleton-primitives";
import { useGameStats } from "@/hooks/use-game-stats";
import { useGames } from "@/hooks/use-games";

export function Stats() {
  const { stats, totalPlayed, totalWins, winRate, isLoading } = useGameStats();
  const { games } = useGames();

  const overview = [
    { label: "Games Played", value: String(totalPlayed), icon: GameController01Icon, accent: "#a855f7" },
    { label: "Wins", value: String(totalWins), icon: Award01Icon, accent: "#fbbf24" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target02Icon, accent: "#34d399" },
    { label: "Avg Duration", value: "—", icon: Timer01Icon, accent: "#22d3ee" },
    { label: "Current Streak", value: "—", icon: Fire02Icon, accent: "#f97316" },
    { label: "Best Streak", value: "—", icon: Fire02Icon, accent: "#f43f5e" },
  ];

  // Map stats to game catalog for accent colors
  const enrichedStats = stats.map((s) => {
    const game = games.find((g) => g.name === s.gameName);
    return { ...s, accent: game?.accent ?? "#a855f7" };
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ActionButton icon={ChartBarIncreasingIcon} label="Stats" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>Your Stats</DialogTitle>
          <DialogDescription>Lifetime performance across all games</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-2">
              {overview.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1.5 rounded-lg bg-white/[0.03] ring-1 ring-border py-3 px-2">
                  <HugeiconsIcon icon={stat.icon} size={16} style={{ color: stat.accent, filter: `drop-shadow(0 0 4px ${stat.accent}60)` }} />
                  <p className="text-base font-bold leading-tight" style={{ color: stat.accent, textShadow: `0 0 8px ${stat.accent}60` }}>{stat.value}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground text-center">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pt-3 pb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2.5">Per Game</p>
              {enrichedStats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No games played yet</p>
              ) : (
                <div className="space-y-2">
                  {enrichedStats.map((game) => {
                    const rate = game.played > 0 ? Math.round((game.wins / game.played) * 100) : 0;
                    return (
                      <div key={game.gameName} className="flex items-center gap-3">
                        <p className="text-xs font-semibold w-24 truncate shrink-0" style={{ color: game.accent }}>{game.gameName}</p>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rate}%`, backgroundColor: game.accent, boxShadow: `0 0 6px ${game.accent}80` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground w-16 text-right shrink-0">{game.wins}/{game.played} ({rate}%)</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
