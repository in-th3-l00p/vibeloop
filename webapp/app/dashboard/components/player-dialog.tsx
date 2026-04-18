"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserAdd01Icon,
  UserRemove01Icon,
  BubbleChatIcon,
  GameController01Icon,
  Tick02Icon,
  Cancel01Icon,
  TimerIcon,
} from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusDot, StatusLabel } from "./ui/status-indicator";
import { useRelationship } from "@/hooks/use-relationship";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { profileCardThemes } from "../data/theme-presets";
import type { Id } from "@/convex/_generated/dataModel";
import type { Player, ProfileCardTheme } from "../types";

const ease = [0.25, 1, 0.5, 1] as const;
const defaultTheme = profileCardThemes[0];

function resolveCardTheme(themeId: string | undefined): ProfileCardTheme {
  if (!themeId) return defaultTheme;
  return profileCardThemes.find((t) => t.id === themeId) ?? defaultTheme;
}

export interface PlayerDialogProps {
  player: Player;
  userId?: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerDialog({ player, userId, open, onOpenChange }: PlayerDialogProps) {
  const status = (player.status ?? "offline") as "online" | "in-game" | "offline" | "ready" | "idle";
  const {
    relationship,
    isLoading: relLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useRelationship(userId ?? null);

  const targetSettings = useQuery(
    api.settings.getForUser,
    userId ? { userId } : "skip",
  );

  const pc = resolveCardTheme(targetSettings?.profileCardTheme);

  const isSelf = relationship?.kind === "self";
  const isFriend = relationship?.kind === "friends";
  const isPendingOutgoing = relationship?.kind === "pending" && relationship.direction === "outgoing";
  const isPendingIncoming = relationship?.kind === "pending" && relationship.direction === "incoming";
  const isStranger = relationship?.kind === "none";
  const showStatus = isSelf || isFriend;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xs !p-0 gap-0 overflow-hidden"
        style={{
          backgroundColor: pc.nameBg,
          borderColor: pc.borderColor,
        }}
      >
        <div className="h-24 w-full" style={{ background: player.banner ?? `linear-gradient(135deg, ${pc.avatarRing}, ${pc.avatarRing}80)` }} />

        <div className="px-5 pb-5 -mt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.1, ease }}
            className="relative size-16 rounded-full overflow-hidden mb-3"
            style={{ boxShadow: `0 0 0 4px ${pc.nameBg}, 0 0 0 7px ${pc.avatarRing}` }}
          >
            <Image src="/background.png" alt={player.name} fill className="object-cover" />
          </motion.div>

          <DialogHeader className="!p-0 mb-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2, ease }}
              className="flex items-center gap-2"
            >
              <DialogTitle className="text-base font-bold" style={{ color: pc.nameColor }}>{player.name}</DialogTitle>
              {showStatus && (
                <>
                  <StatusDot status={status} size="md" />
                  <StatusLabel status={status} />
                </>
              )}
            </motion.div>
            <DialogDescription style={{ color: pc.tagColor }}>@{player.tag}</DialogDescription>
          </DialogHeader>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="text-sm mb-4"
            style={{ color: pc.descColor }}
          >
            {player.bio || "No description yet."}
          </motion.p>

          {showStatus && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3, ease }}
              className="grid grid-cols-3 gap-2 mb-4"
            >
              {[
                { value: "—", label: "Games" },
                { value: "—", label: "Wins" },
                { value: "—", label: "Win Rate" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg px-2.5 py-2 text-center"
                  style={{ backgroundColor: `${pc.borderColor}`, border: `1px solid ${pc.divider}` }}
                >
                  <p className="text-sm font-bold" style={{ color: pc.statColor }}>{s.value}</p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: pc.labelColor }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}

          {!isSelf && !relLoading && userId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4, ease }}
              className="flex gap-2"
            >
              {isFriend && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                    style={{ backgroundColor: pc.avatarRing, color: pc.nameBg }}
                  >
                    <HugeiconsIcon icon={GameController01Icon} size={14} />
                    Invite to Lobby
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    className="cursor-pointer flex items-center justify-center rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: `${pc.borderColor}`, color: pc.tagColor, border: `1px solid ${pc.divider}` }}
                  >
                    <HugeiconsIcon icon={BubbleChatIcon} size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => removeFriend(relationship!.friendshipId!)}
                    className="cursor-pointer flex items-center justify-center rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: `${pc.borderColor}`, color: "#f43f5e", border: `1px solid ${pc.divider}` }}
                    title="Remove friend"
                  >
                    <HugeiconsIcon icon={UserRemove01Icon} size={14} />
                  </motion.button>
                </>
              )}

              {isStranger && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={sendRequest}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                  style={{ backgroundColor: pc.avatarRing, color: pc.nameBg }}
                >
                  <HugeiconsIcon icon={UserAdd01Icon} size={14} />
                  Add Friend
                </motion.button>
              )}

              {isPendingOutgoing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => cancelRequest(relationship!.friendshipId!)}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                  style={{ backgroundColor: `${pc.borderColor}`, color: pc.tagColor, border: `1px solid ${pc.divider}` }}
                >
                  <HugeiconsIcon icon={TimerIcon} size={14} />
                  Cancel Request
                </motion.button>
              )}

              {isPendingIncoming && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => acceptRequest(relationship!.friendshipId!)}
                    className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                    style={{ backgroundColor: pc.avatarRing, color: pc.nameBg }}
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                    Accept
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => declineRequest(relationship!.friendshipId!)}
                    className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                    style={{ backgroundColor: `${pc.borderColor}`, color: "#f43f5e", border: `1px solid ${pc.divider}` }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    Decline
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
