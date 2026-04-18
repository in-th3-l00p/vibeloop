"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface ActionBarProps {
  isMyTurn: boolean;
  canCheck: boolean;
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
}

export function ActionBar({
  isMyTurn,
  canCheck,
  callAmount,
  minRaise,
  maxRaise,
  onFold,
  onCheck,
  onCall,
  onRaise,
}: ActionBarProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  if (!isMyTurn) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm text-muted-foreground animate-pulse">
          Waiting for other players...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col gap-3"
    >
      {showRaiseSlider && (
        <div className="flex items-center gap-3 bg-card ring-1 ring-border rounded-xl px-4 py-3">
          <span className="text-xs text-muted-foreground w-12">
            {raiseAmount}
          </span>
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(1, Math.floor(minRaise / 2))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <span className="text-xs text-muted-foreground w-12 text-right">
            {maxRaise}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onFold}
          className="cursor-pointer flex-1 rounded-xl bg-red-500/10 ring-1 ring-red-500/30 text-red-400 py-3 text-sm font-medium transition-all hover:bg-red-500/20 hover:ring-red-500/50"
        >
          Fold
        </button>

        {canCheck ? (
          <button
            onClick={onCheck}
            className="cursor-pointer flex-1 rounded-xl bg-card ring-1 ring-border text-foreground py-3 text-sm font-medium transition-all hover:ring-white/30"
          >
            Check
          </button>
        ) : (
          <button
            onClick={onCall}
            className="cursor-pointer flex-1 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/30 text-blue-400 py-3 text-sm font-medium transition-all hover:bg-blue-500/20 hover:ring-blue-500/50"
          >
            Call {callAmount}
          </button>
        )}

        {showRaiseSlider ? (
          <button
            onClick={() => {
              onRaise(raiseAmount);
              setShowRaiseSlider(false);
              setRaiseAmount(minRaise);
            }}
            className="cursor-pointer flex-1 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 py-3 text-sm font-medium transition-all hover:bg-emerald-500/20 hover:ring-emerald-500/50"
          >
            Raise {raiseAmount}
          </button>
        ) : (
          <button
            onClick={() => {
              setRaiseAmount(minRaise);
              setShowRaiseSlider(true);
            }}
            disabled={maxRaise <= 0}
            className="cursor-pointer flex-1 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 py-3 text-sm font-medium transition-all hover:bg-emerald-500/20 hover:ring-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Raise
          </button>
        )}
      </div>
    </motion.div>
  );
}
