"use client";

import { motion } from "motion/react";
import { useDashboard } from "../dashboard-context";
import { rarityColors } from "../lib/constants";
import type { MarketplaceItem } from "../types";

export function ItemCard({
  item,
  size = "default",
  onClick,
}: {
  item: MarketplaceItem;
  size?: "compact" | "default" | "large";
  onClick?: () => void;
}) {
  const { settings } = useDashboard();
  const { glowEffects } = settings;
  const rc = rarityColors[item.rarity];

  const widthClass = size === "compact" ? "w-28" : size === "large" ? "w-full" : "w-36";
  const heightClass = size === "compact" ? "h-14" : size === "large" ? "h-24" : "h-20";
  const padClass = size === "compact" ? "px-2 pb-2 pt-1.5" : "px-3 pb-3 pt-2";
  const shrinkClass = size === "large" ? "" : "shrink-0";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className={`cursor-pointer group relative ${shrinkClass} ${widthClass} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-[box-shadow,ring-color] duration-300 hover:ring-primary/30 text-left`}
    >
      <div
        className={`${heightClass} w-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center`}
        style={{ background: item.gradient }}
      >
        <span
          className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
          style={{ color: rc, backgroundColor: `${rc}20`, border: `1px solid ${rc}40` }}
        >
          {item.rarity}
        </span>
      </div>
      <div className={padClass}>
        <p
          className="text-xs font-bold truncate"
          style={{ color: item.accent, textShadow: glowEffects ? `0 0 8px ${item.accent}60` : undefined }}
        >
          {item.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{item.type}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-bold text-foreground">{item.price}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">$VIBE</span>
        </div>
      </div>
    </motion.button>
  );
}
