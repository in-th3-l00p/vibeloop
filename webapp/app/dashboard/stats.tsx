"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartBarIncreasingIcon,
  Award01Icon,
  Target02Icon,
  Timer01Icon,
  Fire02Icon,
  GameController01Icon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const overview = [
  { label: "Games Played", value: "142", icon: GameController01Icon, accent: "#a855f7" },
  { label: "Wins", value: "87", icon: Award01Icon, accent: "#fbbf24" },
  { label: "Win Rate", value: "61%", icon: Target02Icon, accent: "#34d399" },
  { label: "Avg Duration", value: "4m 32s", icon: Timer01Icon, accent: "#22d3ee" },
  { label: "Current Streak", value: "5", icon: Fire02Icon, accent: "#f97316" },
  { label: "Best Streak", value: "12", icon: Fire02Icon, accent: "#f43f5e" },
];

const gameStats = [
  { name: "Vibecheck", played: 38, wins: 24, accent: "#a855f7" },
  { name: "Drawl", played: 29, wins: 18, accent: "#22d3ee" },
  { name: "Bluff Royale", played: 31, wins: 20, accent: "#f97316" },
  { name: "Wavelength", played: 22, wins: 14, accent: "#34d399" },
  { name: "Speed Trivia", played: 14, wins: 7, accent: "#fbbf24" },
  { name: "Conspirators", played: 8, wins: 4, accent: "#f43f5e" },
];

export function Stats() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-zinc-900/80 ring-1 ring-white/10 py-4 text-zinc-400 shadow-[0_0_12px_rgba(255,255,255,0.04)] transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.12)]">
          <HugeiconsIcon icon={ChartBarIncreasingIcon} size={22} />
          <span className="text-[11px] uppercase tracking-wider">Stats</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-white ring-white/10 sm:max-w-md !p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-white text-sm font-semibold">Your Stats</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Lifetime performance across all games
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-2">
          {overview.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 rounded-lg bg-white/[0.03] ring-1 ring-white/5 py-3 px-2"
            >
              <HugeiconsIcon
                icon={stat.icon}
                size={16}
                style={{
                  color: stat.accent,
                  filter: `drop-shadow(0 0 4px ${stat.accent}60)`,
                }}
              />
              <p
                className="text-base font-bold leading-tight"
                style={{
                  color: stat.accent,
                  textShadow: `0 0 8px ${stat.accent}60`,
                }}
              >
                {stat.value}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 text-center">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 pt-3 pb-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2.5">
            Per Game
          </p>
          <div className="space-y-2">
            {gameStats.map((game) => {
              const rate = Math.round((game.wins / game.played) * 100);
              return (
                <div key={game.name} className="flex items-center gap-3">
                  <p
                    className="text-xs font-semibold w-24 truncate shrink-0"
                    style={{ color: game.accent }}
                  >
                    {game.name}
                  </p>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: game.accent,
                        boxShadow: `0 0 6px ${game.accent}80`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 w-16 text-right shrink-0">
                    {game.wins}/{game.played} ({rate}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
