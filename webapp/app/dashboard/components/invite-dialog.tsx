"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Tick02Icon, SentIcon } from "@hugeicons/core-free-icons";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusDot } from "./ui/status-indicator";
import { friendsList } from "../data/mock-players";

const statusOrder = { online: 0, "in-game": 1, offline: 2 } as const;
const sorted = [...friendsList].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

export function InviteDialog({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);

  const filtered = sorted.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.tag.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function send() {
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSelected(new Set());
    }, 1500);
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) { setSearch(""); setSelected(new Set()); setSent(false); } }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm !p-0 gap-0 max-h-[75vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>Select friends to invite to your lobby</DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-secondary ring-1 ring-border px-3 py-2 focus-within:ring-ring">
            <HugeiconsIcon icon={Search01Icon} size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-6">No friends found</p>
          )}
          {filtered.map((friend) => {
            const isSelected = selected.has(friend.tag);
            const isOffline = friend.status === "offline";
            return (
              <button
                key={friend.tag}
                onClick={() => !isOffline && toggle(friend.tag)}
                disabled={isOffline}
                className={`cursor-pointer w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent"
                } ${isOffline ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="relative shrink-0">
                  <div className="size-9 rounded-full overflow-hidden ring-1 ring-border">
                    <Image src="/background.png" alt={friend.name} fill className="object-cover" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot status={friend.status} size="md" />
                  </span>
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: isOffline ? undefined : friend.accent }}
                  >
                    {friend.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">@{friend.tag}</p>
                </div>

                {isOffline ? (
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">offline</span>
                ) : (
                  <div
                    className={`shrink-0 size-5 rounded-md ring-1 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-primary ring-primary"
                        : "ring-border"
                    }`}
                  >
                    {isSelected && <HugeiconsIcon icon={Tick02Icon} size={12} className="text-primary-foreground" strokeWidth={3} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border px-4 py-3 shrink-0">
          {sent ? (
            <div className="flex items-center justify-center gap-2 text-primary py-1.5">
              <HugeiconsIcon icon={SentIcon} size={16} />
              <span className="text-xs font-medium">
                Invite{selected.size > 1 ? "s" : ""} sent!
              </span>
            </div>
          ) : (
            <button
              onClick={send}
              disabled={selected.size === 0}
              className="cursor-pointer w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {selected.size === 0
                ? "Select friends to invite"
                : `Send invite to ${selected.size} friend${selected.size > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
