"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { PokerCard } from "./poker-card";
import { getProfileCardById } from "../../lib/theme-utils";

interface PlayerSeatProps {
  username: string;
  tag?: string;
  imageUrl?: string;
  cardTheme?: string;
  chips: number;
  holeCards: string[];
  currentBet: number;
  folded: boolean;
  allIn: boolean;
  eliminated: boolean;
  sittingOut?: boolean;
  readyForNext?: boolean;
  isHandComplete?: boolean;
  turnDeadline?: number;
  isDealer: boolean;
  isCurrentTurn: boolean;
  isSelf: boolean;
  accent: string;
}

export function PlayerSeat({
  username,
  tag,
  imageUrl,
  cardTheme,
  chips,
  holeCards,
  currentBet,
  folded,
  allIn,
  eliminated,
  sittingOut,
  readyForNext,
  isHandComplete,
  turnDeadline,
  isDealer,
  isCurrentTurn,
  isSelf,
  accent,
}: PlayerSeatProps) {
  const opacity = folded || eliminated || sittingOut ? "opacity-40" : "opacity-100";
  const pc = getProfileCardById(cardTheme);

  return (
    <motion.div
      animate={isCurrentTurn ? { scale: [1, 1.03, 1] } : {}}
      transition={
        isCurrentTurn
          ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          : {}
      }
      className={`flex flex-col items-center gap-1.5 ${opacity}`}
    >
      {/* Cards */}
      <div className="flex gap-1">
        {holeCards.length > 0 ? (
          holeCards.map((card, i) => (
            <PokerCard key={i} card={card} size="sm" delay={i * 0.1} />
          ))
        ) : (
          <div className="w-10 h-14" />
        )}
      </div>

      {/* Profile card */}
      <div
        className={`relative rounded-xl overflow-hidden min-w-[100px] transition-all duration-300 ${
          isCurrentTurn
            ? "ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
            : ""
        }`}
        style={{
          backgroundColor: pc.nameBg,
          border: `1px solid ${pc.borderColor}`,
        }}
      >
        {/* Banner strip */}
        <div
          className="h-5 w-full"
          style={{
            background: `linear-gradient(135deg, ${pc.avatarRing}, ${pc.avatarRing}80)`,
          }}
        />

        <div className="relative px-2.5 pb-2 pt-4">
          {/* Avatar */}
          <div
            className="absolute -top-3.5 left-2.5 size-7 rounded-full overflow-hidden"
            style={{
              boxShadow: `0 0 0 2px ${pc.avatarRing}`,
            }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={username} fill className="object-cover" />
            ) : (
              <div
                className="size-full flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: pc.avatarRing, color: pc.nameColor }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Badges */}
          {isDealer && !isHandComplete && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-yellow-500 text-black text-[8px] font-bold flex items-center justify-center shadow-sm">
              D
            </span>
          )}
          {isHandComplete && readyForNext && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center shadow-sm">
              ✓
            </span>
          )}

          {/* Name + tag */}
          <p
            className="text-[11px] font-bold truncate max-w-[90px]"
            style={{ color: pc.nameColor }}
          >
            {username}
          </p>
          {tag && (
            <p
              className="text-[9px] truncate max-w-[90px]"
              style={{ color: pc.tagColor }}
            >
              @{tag}
            </p>
          )}

          {/* Status */}
          <p className="text-[9px] mt-0.5" style={{ color: pc.descColor }}>
            {eliminated
              ? "Out"
              : sittingOut
                ? "Sitting Out"
                : folded
                  ? "Folded"
                  : allIn
                    ? "ALL IN"
                    : `${chips.toLocaleString()} chips`}
          </p>

          {/* Turn timer */}
          {isCurrentTurn && turnDeadline && <TurnTimer deadline={turnDeadline} />}
        </div>
      </div>

      {/* Current bet */}
      {currentBet > 0 && !folded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 bg-card/80 ring-1 ring-border rounded-full px-2 py-0.5"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-[10px] font-mono text-foreground">
            {currentBet}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

function TurnTimer({ deadline }: { deadline: number }) {
  const [pct, setPct] = useState(100);
  const total = 30;

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, (deadline - Date.now()) / 1000);
      setPct((remaining / total) * 100);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [deadline]);

  const color =
    pct > 50 ? "bg-emerald-400" : pct > 20 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="w-full h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-200 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
