"use client";

import { useState, useEffect } from "react";
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
        {isDealer && !isHandComplete && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-500 text-black text-[9px] font-bold flex items-center justify-center shadow-md">
            D
          </span>
        )}
        {isHandComplete && readyForNext && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
            ✓
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
            : sittingOut
              ? "Sitting Out"
              : folded
                ? "Folded"
                : allIn
                  ? "ALL IN"
                  : `${chips.toLocaleString()}`}
        </p>
        {isCurrentTurn && turnDeadline && <TurnTimer deadline={turnDeadline} />}
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
  const total = 30; // matches TURN_TIMEOUT_MS / 1000

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
