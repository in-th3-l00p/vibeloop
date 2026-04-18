"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Tick02Icon, SentIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusDot } from "./ui/status-indicator";
import { useFriends } from "@/hooks/use-friends";
import { useLobby } from "@/hooks/use-lobby";
import { useLobbyInvitations } from "@/hooks/use-lobby-invitations";
import { FriendsSkeleton } from "./ui/skeleton-primitives";
import { getProfileCardById } from "../lib/theme-utils";

const statusOrder = { online: 0, "in-game": 1, offline: 2 } as const;

export function InviteDialog({ children }: { children: React.ReactNode }) {
  const { friends, isLoading } = useFriends();
  const { lobbyId } = useLobby();
  const { invitations, accept, decline } = useLobbyInvitations();
  const sendInvite = useLobbyInvitations().send;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);

  const sorted = [...friends].sort(
    (a, b) =>
      (statusOrder[a.presence.status as keyof typeof statusOrder] ?? 2) -
      (statusOrder[b.presence.status as keyof typeof statusOrder] ?? 2),
  );

  const filtered = sorted.filter(
    (f) =>
      f.user.username.toLowerCase().includes(search.toLowerCase()) ||
      f.user.tag.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!lobbyId || selected.size === 0) return;
    for (const userId of selected) {
      try {
        await sendInvite(lobbyId, userId as any);
      } catch {
        // skip already-invited or already-in-lobby
      }
    }
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSelected(new Set());
    }, 1500);
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) { setSearch(""); setSelected(new Set()); setSent(false); } }}>
      <DialogTrigger asChild>
        <div className="relative">
          {children}
          {invitations.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {invitations.length}
            </span>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm !p-0 gap-0 max-h-[75vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>Select friends to invite to your lobby</DialogDescription>
        </DialogHeader>

        {/* Lobby Invitations Received */}
        {invitations.length > 0 && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Lobby Invitations ({invitations.length})
            </p>
            <div className="space-y-1">
              {invitations.map((inv) => {
                const pc = getProfileCardById(inv.sender.cardTheme);
                return (
                  <div
                    key={inv.invitation._id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2"
                    style={{ backgroundColor: pc.nameBg, border: `1px solid ${pc.borderColor}` }}
                  >
                    <div className="relative size-8 rounded-full overflow-hidden shrink-0" style={{ boxShadow: `0 0 0 2px ${pc.avatarRing}` }}>
                      {inv.sender.imageUrl ? (
                        <Image src={inv.sender.imageUrl} alt={inv.sender.username} fill className="object-cover rounded-full" />
                      ) : (
                        <Image src="/background.png" alt={inv.sender.username} fill className="object-cover rounded-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: pc.nameColor }}>{inv.sender.username}</p>
                      <p className="text-[9px] truncate" style={{ color: pc.tagColor }}>{inv.lobby.name}</p>
                    </div>
                    <button
                      onClick={() => accept(inv.invitation._id)}
                      className="cursor-pointer size-6 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{ backgroundColor: pc.avatarRing, color: pc.nameBg }}
                      title="Join lobby"
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => decline(inv.invitation._id)}
                      className="cursor-pointer size-6 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${pc.borderColor}`, color: "#f43f5e", border: `1px solid ${pc.divider}` }}
                      title="Decline"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
          {isLoading ? (
            <FriendsSkeleton />
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-6">No friends found</p>
          ) : (
            filtered.map((f) => {
              const friend = f.user;
              const status = f.presence.status;
              const isSelected = selected.has(friend._id);
              const isOffline = status === "offline";
              const pc = getProfileCardById(friend.cardTheme);
              return (
                <button
                  key={friend._id}
                  onClick={() => !isOffline && toggle(friend._id)}
                  disabled={isOffline}
                  className={`cursor-pointer w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                    isSelected ? "ring-1 ring-primary/30" : "hover:brightness-125"
                  } ${isOffline ? "opacity-40 cursor-not-allowed" : ""}`}
                  style={{ backgroundColor: pc.nameBg, border: `1px solid ${isSelected ? pc.avatarRing : pc.borderColor}` }}
                >
                  <div className="relative shrink-0">
                    <div
                      className="size-9 rounded-full overflow-hidden"
                      style={{ boxShadow: `0 0 0 2px ${pc.avatarRing}` }}
                    >
                      {friend.imageUrl ? (
                        <Image src={friend.imageUrl} alt={friend.username} fill className="object-cover rounded-full" />
                      ) : (
                        <Image src="/background.png" alt={friend.username} fill className="object-cover rounded-full" />
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot status={status} size="md" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isOffline ? pc.tagColor : pc.nameColor }}
                    >
                      {friend.username}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: pc.tagColor }}>@{friend.tag}</p>
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
            })
          )}
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
              onClick={handleSend}
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
