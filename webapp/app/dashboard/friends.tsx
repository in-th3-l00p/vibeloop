"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const friends = [
  { name: "xViper", tag: "viper", status: "online" as const, accent: "#a855f7", bio: "ranked demon" },
  { name: "NovaKid", tag: "nova", status: "online" as const, accent: "#22d3ee", bio: "chill vibes only" },
  { name: "GhostRacer", tag: "ghost", status: "in-game" as const, accent: "#f97316", bio: "speed is everything" },
  { name: "ZenithX", tag: "zenith", status: "online" as const, accent: "#34d399", bio: "gg ez" },
  { name: "LunaWolf", tag: "luna", status: "offline" as const, accent: "#a78bfa", bio: "howl at the moon" },
  { name: "Blitz99", tag: "blitz", status: "online" as const, accent: "#f43f5e", bio: "never sleeping" },
  { name: "ArcticFox", tag: "arctic", status: "offline" as const, accent: "#38bdf8", bio: "ice cold plays" },
  { name: "Ember", tag: "ember", status: "in-game" as const, accent: "#fb923c", bio: "burn it down" },
] as const;

const statusOrder = { online: 0, "in-game": 1, offline: 2 } as const;
const sorted = [...friends].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

function StatusDot({ status }: { status: "online" | "in-game" | "offline" }) {
  const color = status === "online" ? "#34d399" : status === "in-game" ? "#fbbf24" : "#71717a";
  return (
    <span
      className="size-2 rounded-full shrink-0"
      style={{ backgroundColor: color, boxShadow: status !== "offline" ? `0 0 6px ${color}80` : undefined }}
    />
  );
}

function StatusLabel({ status }: { status: "online" | "in-game" | "offline" }) {
  const cls = status === "online" ? "text-emerald-400" : status === "in-game" ? "text-amber-400" : "text-zinc-600";
  return <span className={`text-[9px] uppercase tracking-wider font-medium ${cls}`}>{status === "in-game" ? "In Game" : status}</span>;
}

export function Friends() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="cursor-pointer flex flex-col items-center gap-2 rounded-lg bg-card ring-1 ring-border py-4 text-muted-foreground transition-all duration-300 hover:text-white">
          <HugeiconsIcon icon={UserGroupIcon} size={22} />
          <span className="text-[11px] uppercase tracking-wider">Friends</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col !p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Friends</SheetTitle>
          <p className="text-[10px] text-muted-foreground">
            {friends.filter((f) => f.status !== "offline").length}/{friends.length} online
          </p>
        </SheetHeader>

        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 py-2 transition-shadow duration-300 focus-within:ring-white/20">
            <HugeiconsIcon icon={Search01Icon} size={14} className="text-muted-foreground shrink-0" />
            <input type="text" placeholder="Search friends..." className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-0.5">
          {sorted.map((friend) => (
            <button key={friend.tag} className="cursor-pointer w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-white/5 group">
              <div className="relative shrink-0">
                <div
                  className="size-9 rounded-full overflow-hidden transition-shadow duration-300"
                  style={{ outline: `1px solid ${friend.accent}40`, boxShadow: friend.status !== "offline" ? `0 0 8px ${friend.accent}30` : undefined }}
                >
                  <Image src="/background.png" alt={friend.name} fill className="object-cover" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status={friend.status} /></span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold truncate" style={{ color: friend.status === "offline" ? "#71717a" : friend.accent, textShadow: friend.status !== "offline" ? `0 0 6px ${friend.accent}40` : undefined }}>{friend.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">@{friend.tag}</p>
              </div>
              <StatusLabel status={friend.status} />
            </button>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <button className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 py-2.5 text-muted-foreground transition-all duration-300 hover:text-white">
            <HugeiconsIcon icon={UserAdd01Icon} size={16} />
            <span className="text-xs font-medium">Add Friend</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
