"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { GameController01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDashboard } from "../dashboard-context";
import { useGameStats } from "@/hooks/use-game-stats";
import { useLobby } from "@/hooks/use-lobby";
import type { Game } from "../types";

export function GameDialog({
  game,
  open,
  onOpenChange,
}: {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, user } = useDashboard();
  const { glowEffects } = settings;
  const { stats } = useGameStats();
  const { myLobby } = useLobby();

  const stat = stats.find((s) => s.gameName === game.name);
  const rate = stat && stat.played > 0 ? Math.round((stat.wins / stat.played) * 100) : null;

  const lobbyMembers = myLobby?.members ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm !p-0 gap-0 overflow-hidden">
        <div className="h-28 w-full flex items-center justify-center relative" style={{ background: game.gradient }}>
          <span className="text-5xl drop-shadow-lg">{game.emoji}</span>
        </div>

        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle
            className="text-base font-bold"
            style={{ color: game.accent, textShadow: glowEffects ? `0 0 12px ${game.accent}60` : undefined }}
          >
            {game.name}
          </DialogTitle>
          <DialogDescription>{game.desc}</DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-3 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-secondary ring-1 ring-border px-3 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Players</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{game.players}</p>
            </div>
            <div className="rounded-lg bg-secondary ring-1 ring-border px-3 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Category</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: game.accent }}>{game.tag}</p>
            </div>
          </div>

          {stat && rate !== null && (
            <div className="rounded-lg bg-secondary ring-1 ring-border px-3 py-2.5 space-y-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Your Stats</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{stat.played} played</span>
                <span className="text-muted-foreground">{stat.wins} wins</span>
                <span className="font-medium" style={{ color: game.accent }}>{rate}% win rate</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${rate}%`, backgroundColor: game.accent, boxShadow: glowEffects ? `0 0 6px ${game.accent}80` : undefined }}
                />
              </div>
            </div>
          )}

          {lobbyMembers.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lobby</p>
                <span className="text-[9px] text-muted-foreground">{lobbyMembers.length} players</span>
              </div>
              <div className="flex items-center">
                <div className="relative size-8 rounded-full overflow-hidden ring-2 ring-card z-10" style={{ outline: `2px solid ${game.accent}` }}>
                  {user.imageUrl ? (
                    <Image src={user.imageUrl} alt={user.fullName} fill className="object-cover" />
                  ) : (
                    <div className="size-full bg-zinc-700 flex items-center justify-center text-xs font-bold">{user.firstName.charAt(0)}</div>
                  )}
                </div>
                {lobbyMembers.slice(0, 5).map((m, i) => (
                  <div
                    key={m.user._id}
                    className="relative size-8 rounded-full overflow-hidden ring-2 ring-card -ml-2"
                    style={{ zIndex: 5 - i, outline: `2px solid ${m.user.accent}` }}
                  >
                    {m.user.imageUrl ? (
                      <Image src={m.user.imageUrl} alt={m.user.username} fill className="object-cover" />
                    ) : (
                      <Image src="/background.png" alt={m.user.username} fill className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium transition-all duration-200 hover:opacity-90">
            <HugeiconsIcon icon={GameController01Icon} size={14} />
            Play Now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
