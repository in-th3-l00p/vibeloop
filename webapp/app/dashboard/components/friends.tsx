"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Search01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ActionButton } from "./ui/action-button";
import { StatusDot, StatusLabel } from "./ui/status-indicator";
import { FriendsSkeleton } from "./ui/skeleton-primitives";
import { PlayerDialog } from "./player-dialog";
import { PendingRequestCard, type PendingRequestUser } from "./pending-request-card";
import { useFriends } from "@/hooks/use-friends";
import { usePendingRequests } from "@/hooks/use-pending-requests";
import { getProfileCardById } from "../lib/theme-utils";
import type { Player } from "../types";
import type { Id } from "@/convex/_generated/dataModel";

const statusOrder = { online: 0, "in-game": 1, offline: 2 } as const;

interface SelectedPlayer {
  player: Player;
  userId: Id<"users">;
}

export function Friends() {
  const { friends, onlineCount, totalCount, isLoading } = useFriends();
  const { incoming, outgoing, incomingCount, accept, decline, cancel } = usePendingRequests();
  const [selected, setSelected] = useState<SelectedPlayer | null>(null);

  const sorted = [...friends].sort(
    (a, b) =>
      (statusOrder[a.presence.status as keyof typeof statusOrder] ?? 2) -
      (statusOrder[b.presence.status as keyof typeof statusOrder] ?? 2),
  );

  function openProfile(user: PendingRequestUser) {
    setSelected({
      player: {
        name: user.username,
        tag: user.tag,
        accent: user.accent,
        bio: user.bio,
        status: "offline",
        banner: user.banner,
      },
      userId: user._id,
    });
  }

  const hasPending = incoming.length > 0 || outgoing.length > 0;

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <div className="relative">
            <ActionButton icon={UserGroupIcon} label="Friends" />
            {incomingCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {incomingCount}
              </span>
            )}
          </div>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col !p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle>Friends</SheetTitle>
            <p className="text-[10px] text-muted-foreground">
              {onlineCount}/{totalCount} online
            </p>
          </SheetHeader>

          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 py-2 transition-shadow duration-300 focus-within:ring-white/20">
              <HugeiconsIcon icon={Search01Icon} size={14} className="text-muted-foreground shrink-0" />
              <input type="text" placeholder="Search friends..." className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Incoming Requests */}
            {incoming.length > 0 && (
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1.5">
                  Incoming Requests ({incoming.length})
                </p>
                <div className="space-y-1">
                  {incoming.map((req) => (
                    <PendingRequestCard
                      key={req.friendship._id}
                      user={req.user}
                      friendshipId={req.friendship._id}
                      direction="incoming"
                      onAccept={accept}
                      onDecline={decline}
                      onCancel={cancel}
                      onOpenProfile={openProfile}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoing.length > 0 && (
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1.5">
                  Sent Requests ({outgoing.length})
                </p>
                <div className="space-y-1">
                  {outgoing.map((req) => (
                    <PendingRequestCard
                      key={req.friendship._id}
                      user={req.user}
                      friendshipId={req.friendship._id}
                      direction="outgoing"
                      onAccept={accept}
                      onDecline={decline}
                      onCancel={cancel}
                      onOpenProfile={openProfile}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            {isLoading ? (
              <FriendsSkeleton />
            ) : sorted.length === 0 && !hasPending ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-xs text-muted-foreground">No friends yet</p>
              </div>
            ) : (
              <div className="px-3 py-2 space-y-0.5">
                {sorted.length > 0 && hasPending && (
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1.5 mt-1">
                    Friends ({sorted.length})
                  </p>
                )}
                {sorted.map((f) => {
                  const friend = f.user;
                  const status = f.presence.status;
                  const pc = getProfileCardById(friend.cardTheme);
                  return (
                    <button
                      key={friend._id}
                      onClick={() =>
                        setSelected({
                          player: {
                            name: friend.username,
                            tag: friend.tag,
                            accent: friend.accent,
                            bio: friend.bio,
                            status,
                            banner: friend.banner,
                          },
                          userId: friend._id,
                        })
                      }
                      className="cursor-pointer w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-white/5 group"
                    >
                      <div className="relative shrink-0">
                        <div
                          className="size-9 rounded-full overflow-hidden transition-shadow duration-300"
                          style={{
                            boxShadow: `0 0 0 2px ${pc.avatarRing}${status !== "offline" ? `, 0 0 8px ${pc.avatarRing}30` : ""}`,
                          }}
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
                          style={{
                            color: status === "offline" ? pc.tagColor : pc.nameColor,
                            textShadow: status !== "offline" ? `0 0 6px ${pc.nameColor}40` : undefined,
                          }}
                        >
                          {friend.username}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: pc.tagColor }}>@{friend.tag}</p>
                      </div>
                      <StatusLabel status={status} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <button className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 py-2.5 text-muted-foreground transition-all duration-300 hover:text-white">
              <HugeiconsIcon icon={UserAdd01Icon} size={16} />
              <span className="text-xs font-medium">Add Friend</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {selected && (
        <PlayerDialog player={selected.player} userId={selected.userId} open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
      )}
    </>
  );
}
