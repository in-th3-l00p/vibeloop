"use client";

import { motion } from "motion/react";
import { PokerCard } from "./poker-card";

interface PlayerSeatProps {
  username: string;
  chips: number;
  holeCards: string[];
  currentBet: number;
  folded: boolean;
  allIn: boolean;
  eliminated: boolean;
  isDealer: boolean;
  isCurrentTurn: boolean;
  isSelf: boolean;
  accent: string;
}

export function PlayerSeat({
  username,
  chips,
  holeCards,
  currentBet,
  folded,
  allIn,
  eliminated,
  isDealer,
  isCurrentTurn,
  isSelf,
  accent,
}: PlayerSeatProps) {
  const opacity = folded || eliminated ? "opacity-40" : "opacity-100";

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

      {/* Name plate */}
      <div
        className={`relative rounded-lg px-3 py-1.5 text-center min-w-[80px] transition-all duration-300 ${
          isCurrentTurn
            ? "ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
            : "ring-1 ring-border"
        }`}
        style={{
          backgroundColor: isSelf ? `${accent}15` : "var(--card)",
        }}
      >
        {isDealer && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-500 text-black text-[9px] font-bold flex items-center justify-center shadow-md">
            D
          </span>
        )}
        <p
          className="text-xs font-bold truncate max-w-[80px]"
          style={{
            color: isSelf ? accent : "var(--foreground)",
          }}
        >
          {username}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {eliminated
            ? "Out"
            : folded
              ? "Folded"
              : allIn
                ? "ALL IN"
                : `${chips.toLocaleString()}`}
        </p>
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
