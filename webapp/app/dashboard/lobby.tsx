"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDashboard } from "./dashboard-context";

const players = [
  { name: "xViper", tag: "viper", status: "ready" as const, banner: "linear-gradient(135deg, #6d28d9, #db2777, #f59e0b)", accent: "#a855f7", bio: "ranked demon" },
  { name: "NovaKid", tag: "nova", status: "ready" as const, banner: "linear-gradient(135deg, #0ea5e9, #06b6d4, #22d3ee)", accent: "#22d3ee", bio: "chill vibes only" },
  { name: "GhostRacer", tag: "ghost", status: "idle" as const, banner: "linear-gradient(135deg, #f97316, #ef4444, #dc2626)", accent: "#f97316", bio: "speed is everything" },
  { name: "ZenithX", tag: "zenith", status: "ready" as const, banner: "linear-gradient(135deg, #10b981, #059669, #047857)", accent: "#34d399", bio: "gg ez" },
  { name: "LunaWolf", tag: "luna", status: "idle" as const, banner: "linear-gradient(135deg, #8b5cf6, #6d28d9, #4c1d95)", accent: "#a78bfa", bio: "howl at the moon" },
] as const;

const mockMessages = [
  { from: "xViper", accent: "#a855f7", text: "yo who's ready to run it", time: "2:31 PM" },
  { from: "NovaKid", accent: "#22d3ee", text: "let's gooo", time: "2:31 PM" },
  { from: "GhostRacer", accent: "#f97316", text: "one sec grabbing a drink", time: "2:32 PM" },
  { from: "xViper", accent: "#a855f7", text: "hurry up ghost we're all waiting", time: "2:33 PM" },
  { from: "ZenithX", accent: "#34d399", text: "gg ez incoming", time: "2:33 PM" },
  { from: "LunaWolf", accent: "#a78bfa", text: "don't jinx it lol", time: "2:34 PM" },
  { from: "NovaKid", accent: "#22d3ee", text: "luna's right, last time you said that we got destroyed", time: "2:34 PM" },
  { from: "GhostRacer", accent: "#f97316", text: "ok i'm back, let's go", time: "2:35 PM" },
];

export function Lobby() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Lobby</p>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white flex items-center gap-1.5">
                <HugeiconsIcon icon={BubbleChatIcon} size={14} />
                Chat
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col !p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle>Lobby Chat</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
                {mockMessages.map((msg, i) => (
                  <div key={i}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold shrink-0" style={{ color: msg.accent, textShadow: `0 0 6px ${msg.accent}40` }}>{msg.from}</span>
                      <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-0.5">{msg.text}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Type a message..." className="flex-1 rounded-lg bg-card ring-1 ring-border px-3 py-2 text-sm text-white placeholder:text-muted-foreground outline-none focus:ring-white/20" />
                  <button className="cursor-pointer rounded-lg bg-card ring-1 ring-border px-3 py-2 text-muted-foreground transition-all duration-300 hover:text-white">
                    <HugeiconsIcon icon={BubbleChatIcon} size={16} />
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white">
            + Add
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {players.map((player) => (
          <div
            key={player.name}
            className={`group relative shrink-0 ${compactMode ? "w-32" : "w-40"} rounded-xl overflow-hidden bg-card ring-1 ring-border transition-all duration-300`}
          >
            <div className={`${compactMode ? "h-12" : "h-16"} w-full`} style={{ background: player.banner }} />
            <div className="relative px-3 pb-3">
              <div
                className="absolute -top-5 left-3 size-10 rounded-full overflow-hidden transition-shadow duration-300"
                style={{ outline: `3px solid ${player.accent}`, boxShadow: glowEffects ? `0 0 10px ${player.accent}40` : undefined }}
              >
                <Image src="/background.png" alt={player.name} fill className="object-cover" />
              </div>
              <div className="pt-7">
                <p className="text-sm font-bold truncate" style={{ color: player.accent, textShadow: glowEffects ? `0 0 8px ${player.accent}60` : undefined }}>{player.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">@{player.tag}</p>
                <p className="text-[11px] text-zinc-400 mt-1 truncate">{player.bio}</p>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: player.status === "ready" ? "#34d399" : "#fbbf24", boxShadow: glowEffects ? `0 0 6px ${player.status === "ready" ? "#34d39980" : "#fbbf2480"}` : undefined }}
                />
                <span className={`text-[9px] uppercase tracking-wider font-medium ${player.status === "ready" ? "text-emerald-400" : "text-amber-400"}`}>
                  {player.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className={`group relative shrink-0 ${compactMode ? "w-32" : "w-40"} rounded-xl overflow-hidden bg-card ring-1 ring-border transition-all duration-300 opacity-40`}>
          <div className="flex flex-col items-center justify-center h-full min-h-[148px]">
            <span className="text-2xl text-muted-foreground">+</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">open slot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
