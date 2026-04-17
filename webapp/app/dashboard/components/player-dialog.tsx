"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, BubbleChatIcon, GameController01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusDot, StatusLabel } from "./ui/status-indicator";
import type { Player } from "../types";

const ease = [0.25, 1, 0.5, 1] as const;

export function PlayerDialog({
  player,
  open,
  onOpenChange,
}: {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const status = (player.status ?? "offline") as "online" | "in-game" | "offline" | "ready" | "idle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs !p-0 gap-0 overflow-hidden">
        <div className="h-24 w-full" style={{ background: player.banner ?? `linear-gradient(135deg, ${player.accent}, ${player.accent}80)` }} />

        <div className="px-5 pb-5 -mt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.1, ease }}
            className="relative size-16 rounded-full overflow-hidden ring-4 ring-card mb-3"
            style={{ outline: `3px solid ${player.accent}` }}
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
              <DialogTitle className="text-base font-bold" style={{ color: player.accent }}>{player.name}</DialogTitle>
              <StatusDot status={status} size="md" />
              <StatusLabel status={status} />
            </motion.div>
            <DialogDescription>@{player.tag}</DialogDescription>
          </DialogHeader>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="text-sm text-muted-foreground mb-4"
          >
            {player.bio}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3, ease }}
            className="grid grid-cols-3 gap-2 mb-4"
          >
            <div className="rounded-lg bg-secondary ring-1 ring-border px-2.5 py-2 text-center">
              <p className="text-sm font-bold text-foreground">47</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Games</p>
            </div>
            <div className="rounded-lg bg-secondary ring-1 ring-border px-2.5 py-2 text-center">
              <p className="text-sm font-bold text-foreground">28</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Wins</p>
            </div>
            <div className="rounded-lg bg-secondary ring-1 ring-border px-2.5 py-2 text-center">
              <p className="text-sm font-bold" style={{ color: player.accent }}>60%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4, ease }}
            className="flex gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium"
            >
              <HugeiconsIcon icon={GameController01Icon} size={14} />
              Invite to Lobby
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} className="cursor-pointer flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground ring-1 ring-border px-3 py-2.5">
              <HugeiconsIcon icon={BubbleChatIcon} size={14} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} className="cursor-pointer flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground ring-1 ring-border px-3 py-2.5">
              <HugeiconsIcon icon={UserAdd01Icon} size={14} />
            </motion.button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
