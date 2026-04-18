"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Cancel01Icon, TimerIcon } from "@hugeicons/core-free-icons";
import { getProfileCardById } from "../lib/theme-utils";
import type { Id } from "@/convex/_generated/dataModel";

export interface PendingRequestUser {
  _id: Id<"users">;
  username: string;
  tag: string;
  accent: string;
  imageUrl: string;
  bio: string;
  banner?: string;
  cardTheme?: string;
}

export interface PendingRequestCardProps {
  user: PendingRequestUser;
  friendshipId: Id<"friendships">;
  direction: "incoming" | "outgoing";
  onAccept: (friendshipId: Id<"friendships">) => void;
  onDecline: (friendshipId: Id<"friendships">) => void;
  onCancel: (friendshipId: Id<"friendships">) => void;
  onOpenProfile: (user: PendingRequestUser) => void;
}

export function PendingRequestCard({
  user,
  friendshipId,
  direction,
  onAccept,
  onDecline,
  onCancel,
  onOpenProfile,
}: PendingRequestCardProps) {
  const pc = getProfileCardById(user.cardTheme);

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{ backgroundColor: `${pc.borderColor}`, border: `1px solid ${pc.divider}` }}
    >
      <button
        onClick={() => onOpenProfile(user)}
        className="cursor-pointer relative size-9 rounded-full overflow-hidden shrink-0 transition-opacity hover:opacity-80"
        style={{ boxShadow: `0 0 0 2px ${pc.avatarRing}` }}
      >
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt={user.username} fill className="object-cover rounded-full" />
        ) : (
          <Image src="/background.png" alt={user.username} fill className="object-cover rounded-full" />
        )}
      </button>
      <button
        onClick={() => onOpenProfile(user)}
        className="cursor-pointer min-w-0 flex-1 text-left transition-opacity hover:opacity-80"
      >
        <p className="text-sm font-semibold truncate" style={{ color: pc.nameColor }}>
          {user.username}
        </p>
        <p className="text-[10px] truncate" style={{ color: pc.tagColor }}>@{user.tag}</p>
      </button>

      {direction === "incoming" ? (
        <>
          <button
            onClick={() => onAccept(friendshipId)}
            className="cursor-pointer size-7 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: pc.avatarRing, color: pc.nameBg }}
            title="Accept"
          >
            <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={3} />
          </button>
          <button
            onClick={() => onDecline(friendshipId)}
            className="cursor-pointer size-7 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: `${pc.borderColor}`, color: "#f43f5e", border: `1px solid ${pc.divider}` }}
            title="Decline"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </button>
        </>
      ) : (
        <button
          onClick={() => onCancel(friendshipId)}
          className="cursor-pointer flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] uppercase tracking-wider transition-all hover:opacity-80"
          style={{ backgroundColor: `${pc.borderColor}`, color: pc.tagColor, border: `1px solid ${pc.divider}` }}
          title="Cancel request"
        >
          <HugeiconsIcon icon={TimerIcon} size={12} />
          Pending
        </button>
      )}
    </div>
  );
}
