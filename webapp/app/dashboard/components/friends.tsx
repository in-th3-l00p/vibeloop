"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Search01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ActionButton } from "./ui/action-button";
import { StatusDot, StatusLabel } from "./ui/status-indicator";
import { friendsList } from "../data/mock-players";

const statusOrder = { online: 0, "in-game": 1, offline: 2 } as const;
const sorted = [...friendsList].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

export function Friends() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <ActionButton icon={UserGroupIcon} label="Friends" />
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col !p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Friends</SheetTitle>
          <p className="text-[10px] text-muted-foreground">
            {friendsList.filter((f) => f.status !== "offline").length}/{friendsList.length} online
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
                <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status={friend.status} size="md" /></span>
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
