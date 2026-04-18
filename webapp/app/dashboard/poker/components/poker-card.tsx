"use client";

import { motion } from "motion/react";

const SUIT_SYMBOLS: Record<string, string> = {
  h: "\u2665",
  d: "\u2666",
  c: "\u2663",
  s: "\u2660",
};

const SUIT_COLORS: Record<string, string> = {
  h: "#ef4444",
  d: "#ef4444",
  c: "#1e1e2e",
  s: "#1e1e2e",
};

const RANK_DISPLAY: Record<string, string> = {
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A",
};

export function PokerCard({
  card,
  size = "md",
  delay = 0,
}: {
  card: string;
  size?: "sm" | "md" | "lg";
  delay?: number;
}) {
  const isFaceDown = card === "?";

  const sizeClasses = {
    sm: "w-10 h-14 text-xs",
    md: "w-14 h-20 text-sm",
    lg: "w-18 h-26 text-base",
  };

  if (isFaceDown) {
    return (
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay }}
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 ring-1 ring-white/10 flex items-center justify-center shadow-lg`}
      >
        <div className="w-[70%] h-[75%] rounded border border-emerald-600/40 bg-emerald-900/50 flex items-center justify-center">
          <span className="text-emerald-400/60 text-lg">♠</span>
        </div>
      </motion.div>
    );
  }

  const rank = card[0];
  const suit = card[1];
  const displayRank = RANK_DISPLAY[rank] ?? rank;
  const suitSymbol = SUIT_SYMBOLS[suit] ?? suit;
  const color = SUIT_COLORS[suit] ?? "#1e1e2e";

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`${sizeClasses[size]} rounded-lg bg-white ring-1 ring-black/10 flex flex-col items-center justify-center shadow-lg relative`}
      style={{ color }}
    >
      <span className="absolute top-1 left-1.5 text-[0.65em] font-bold leading-none">
        {displayRank}
      </span>
      <span className="text-[1.3em]">{suitSymbol}</span>
      <span className="absolute bottom-1 right-1.5 text-[0.65em] font-bold leading-none rotate-180">
        {displayRank}
      </span>
    </motion.div>
  );
}
