"use client";

import Link from "next/link";
import { useDashboard } from "../dashboard-context";
import { SectionHeader } from "../components/ui/section-header";
import { ScrollRow } from "../components/ui/scroll-row";
import { rarityColors } from "../lib/constants";
import { marketplaceItems } from "../data/mock-marketplace";

export function Marketplace() {
  const { settings } = useDashboard();
  const { compactMode, glowEffects } = settings;

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <SectionHeader title="Marketplace" action="Browse All" href="/dashboard/marketplace" />
      <ScrollRow>
        {marketplaceItems.map((item) => {
          const rc = rarityColors[item.rarity];
          return (
            <Link
              key={item.slug}
              href={`/dashboard/marketplace/${item.slug}`}
              className={`group relative shrink-0 ${compactMode ? "w-28" : "w-36"} overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 text-left block`}
            >
              <div className={`${compactMode ? "h-14" : "h-20"} w-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center`} style={{ background: item.gradient }}>
                <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ color: rc, backgroundColor: `${rc}20`, border: `1px solid ${rc}40` }}>{item.rarity}</span>
              </div>
              <div className={compactMode ? "px-2 pb-2 pt-1.5" : "px-3 pb-3 pt-2"}>
                <p className="text-xs font-bold truncate" style={{ color: item.accent, textShadow: glowEffects ? `0 0 8px ${item.accent}60` : undefined }}>{item.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.type}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-white">{item.price}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">$VIBE</span>
                </div>
              </div>
            </Link>
          );
        })}
      </ScrollRow>
    </div>
  );
}
