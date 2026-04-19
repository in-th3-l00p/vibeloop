"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";

interface ActionBarProps {
  isMyTurn: boolean;
  canCheck: boolean;
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  totalPot: number;
  disabled?: boolean;
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
  totalPot,
  disabled,
  onFold,
  onCheck,
  onCall,
  onRaise,
}: ActionBarProps) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaisePanel, setShowRaisePanel] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const halfPot = Math.max(minRaise, Math.floor(totalPot / 2));
  const potRaise = Math.max(minRaise, totalPot);

  const clamp = useCallback(
    (v: number) => Math.min(maxRaise, Math.max(minRaise, v)),
    [minRaise, maxRaise],
  );

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
      className="flex flex-col gap-2 max-w-4xl w-full mx-auto"
    >
      {showRaisePanel && (
        <div className="bg-card ring-1 ring-border rounded-xl px-4 py-3 space-y-2">
          {/* Preset buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRaiseAmount(clamp(minRaise))}
              className="cursor-pointer text-[10px] px-2.5 py-1 rounded-lg bg-secondary ring-1 ring-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Min
            </button>
            <button
              onClick={() => setRaiseAmount(clamp(halfPot))}
              className="cursor-pointer text-[10px] px-2.5 py-1 rounded-lg bg-secondary ring-1 ring-border text-muted-foreground hover:text-foreground transition-colors"
            >
              ½ Pot
            </button>
            <button
              onClick={() => setRaiseAmount(clamp(potRaise))}
              className="cursor-pointer text-[10px] px-2.5 py-1 rounded-lg bg-secondary ring-1 ring-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Pot
            </button>
            <button
              onClick={() => setRaiseAmount(maxRaise)}
              className="cursor-pointer text-[10px] px-2.5 py-1 rounded-lg bg-red-500/10 ring-1 ring-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              All-In
            </button>
            <div className="flex-1" />
            <input
              type="number"
              value={customInput || raiseAmount}
              onChange={(e) => {
                setCustomInput(e.target.value);
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setRaiseAmount(clamp(v));
              }}
              onBlur={() => setCustomInput("")}
              className="w-20 text-right text-xs font-mono bg-secondary ring-1 ring-border rounded-lg px-2 py-1 text-foreground outline-none focus:ring-white/20"
              min={minRaise}
              max={maxRaise}
            />
          </div>

          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-muted-foreground font-mono w-8">
              {minRaise}
            </span>
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={Math.max(1, Math.floor(minRaise / 2))}
              value={raiseAmount}
              onChange={(e) => {
                setRaiseAmount(Number(e.target.value));
                setCustomInput("");
              }}
              className="flex-1 accent-emerald-500 h-1.5"
            />
            <span className="text-[9px] text-muted-foreground font-mono w-8 text-right">
              {maxRaise}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          disabled={disabled}
          onClick={onFold}
          className="cursor-pointer flex-1 rounded-xl bg-red-500/10 ring-1 ring-red-500/30 text-red-400 py-3 text-sm font-medium transition-all hover:bg-red-500/20 hover:ring-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Fold
        </button>

        {canCheck ? (
          <button
            disabled={disabled}
            onClick={onCheck}
            className="cursor-pointer flex-1 rounded-xl bg-card ring-1 ring-border text-foreground py-3 text-sm font-medium transition-all hover:ring-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Check
          </button>
        ) : (
          <button
            disabled={disabled}
            onClick={onCall}
            className="cursor-pointer flex-1 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/30 text-blue-400 py-3 text-sm font-medium transition-all hover:bg-blue-500/20 hover:ring-blue-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Call {callAmount}
          </button>
        )}

        {showRaisePanel ? (
          <button
            disabled={disabled}
            onClick={() => {
              onRaise(raiseAmount);
              setShowRaisePanel(false);
              setRaiseAmount(minRaise);
              setCustomInput("");
            }}
            className="cursor-pointer flex-1 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 py-3 text-sm font-medium transition-all hover:bg-emerald-500/20 hover:ring-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Raise {raiseAmount}
          </button>
        ) : (
          <button
            disabled={disabled || maxRaise <= 0}
            onClick={() => {
              setRaiseAmount(minRaise);
              setShowRaisePanel(true);
            }}
            className="cursor-pointer flex-1 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-400 py-3 text-sm font-medium transition-all hover:bg-emerald-500/20 hover:ring-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Raise
          </button>
        )}
      </div>
    </motion.div>
  );
}
