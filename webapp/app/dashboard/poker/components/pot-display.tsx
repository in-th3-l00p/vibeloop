"use client";

import { motion } from "motion/react";

interface PotDisplayProps {
  totalPot: number;
  pots: { amount: number; eligible: string[] }[];
}

export function PotDisplay({ totalPot, pots }: PotDisplayProps) {
  const hasSidePots = pots.length > 1;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        key={totalPot}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-2 bg-card/80 ring-1 ring-border rounded-full px-4 py-1.5 backdrop-blur-sm"
      >
        <div className="flex -space-x-1">
          <div className="w-4 h-4 rounded-full bg-yellow-500 ring-1 ring-yellow-600" />
          <div className="w-4 h-4 rounded-full bg-yellow-400 ring-1 ring-yellow-500" />
          <div className="w-4 h-4 rounded-full bg-yellow-300 ring-1 ring-yellow-400" />
        </div>
        <span className="text-sm font-bold text-foreground font-mono">
          {totalPot.toLocaleString()}
        </span>
      </motion.div>

      {hasSidePots && (
        <div className="flex gap-1.5">
          {pots.map((pot, i) => (
            <span
              key={i}
              className="text-[9px] text-muted-foreground bg-card/60 ring-1 ring-border rounded-full px-2 py-0.5"
            >
              {i === 0 ? "Main" : `Side ${i}`}: {pot.amount}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
