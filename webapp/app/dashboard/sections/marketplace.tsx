"use client";

import { useDashboard } from "../dashboard-context";

const marketplaceItems = [
  { name: "Neon Pulse", type: "Card Theme", price: "120", accent: "#a855f7", gradient: "linear-gradient(135deg, #7c3aed, #c026d3, #e879f9)", rarity: "rare" },
  { name: "OG Founder", type: "Badge", price: "500", accent: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)", rarity: "legendary" },
  { name: "Glacier", type: "Card Theme", price: "80", accent: "#38bdf8", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4, #67e8f9)", rarity: "uncommon" },
  { name: "Hot Streak", type: "Badge", price: "200", accent: "#f97316", gradient: "linear-gradient(135deg, #ef4444, #f97316, #fbbf24)", rarity: "rare" },
  { name: "Phantom", type: "Avatar Border", price: "150", accent: "#a78bfa", gradient: "linear-gradient(135deg, #4c1d95, #6d28d9, #8b5cf6)", rarity: "rare" },
  { name: "Emerald Crown", type: "Badge", price: "350", accent: "#34d399", gradient: "linear-gradient(135deg, #047857, #059669, #10b981)", rarity: "epic" },
  { name: "Bloodline", type: "Card Theme", price: "300", accent: "#f43f5e", gradient: "linear-gradient(135deg, #9f1239, #e11d48, #fb7185)", rarity: "epic" },
  { name: "Minimal", type: "Avatar Border", price: "40", accent: "#a1a1aa", gradient: "linear-gradient(135deg, #3f3f46, #52525b, #71717a)", rarity: "common" },
];

const rarityColor: Record<string, string> = {
  common: "#a1a1aa",
  uncommon: "#22d3ee",
  rare: "#a855f7",
  epic: "#f43f5e",
  legendary: "#fbbf24",
};

export function Marketplace() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Marketplace</p>
        <button className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground rounded-md px-2.5 py-1 bg-card ring-1 ring-border transition-all duration-300 hover:text-white">
          Browse All
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {marketplaceItems.map((item) => {
          const rc = rarityColor[item.rarity];
          return (
            <button
              key={item.name}
              className={`cursor-pointer group relative shrink-0 ${compactMode ? "w-28" : "w-36"} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 text-left`}
            >
              <div
                className={`${compactMode ? "h-14" : "h-20"} w-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center`}
                style={{ background: item.gradient }}
              >
                <span
                  className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                  style={{ color: rc, backgroundColor: `${rc}20`, border: `1px solid ${rc}40` }}
                >
                  {item.rarity}
                </span>
              </div>
              <div className={compactMode ? "px-2 pb-2 pt-1.5" : "px-3 pb-3 pt-2"}>
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: item.accent, textShadow: glowEffects ? `0 0 8px ${item.accent}60` : undefined }}
                >
                  {item.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{item.type}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-white">{item.price}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">$VIBE</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
