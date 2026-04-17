"use client";

import { motion } from "motion/react";
import { useDashboard } from "../dashboard-context";
import type { Game } from "../types";

export function GameCard({
  game,
  size = "default",
  onClick,
}: {
  game: Game;
  size?: "compact" | "default" | "large";
  onClick?: () => void;
}) {
  const { settings } = useDashboard();
  const { glowEffects } = settings;

  const widthClass = size === "compact" ? "w-36" : size === "large" ? "w-full" : "w-44";
  const bannerH = size === "compact" ? "h-10" : size === "large" ? "h-20" : "h-14";
  const padClass = size === "compact" ? "px-2.5 pb-2.5 pt-2" : "px-3.5 pb-3.5 pt-2.5";
  const shrinkClass = size === "large" ? "" : "shrink-0";
  const emojiSize = size === "large" ? "text-2xl" : "text-xl";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className={`cursor-pointer group relative ${shrinkClass} ${widthClass} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-[box-shadow,ring-color] duration-300 hover:ring-primary/30 text-left`}
    >
      <div className={`${bannerH} w-full opacity-60 group-hover:opacity-80 transition-opacity duration-300`} style={{ background: game.gradient }} />
      <div className={`absolute top-2.5 right-3 ${emojiSize} opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg`}>{game.emoji}</div>
      <div className={padClass}>
        <p className="text-sm font-bold truncate" style={{ color: game.accent, textShadow: glowEffects ? `0 0 8px ${game.accent}60` : undefined }}>{game.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{game.desc}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full" style={{ color: game.accent, backgroundColor: `${game.accent}15` }}>{game.tag}</span>
          <span className="text-[10px] text-muted-foreground">{game.players}</span>
        </div>
      </div>
    </motion.button>
  );
}
