"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import type { MarketplaceItem } from "../types";
import { useDashboard } from "../dashboard-context";
import { rarityColors } from "../lib/constants";
import { marketplaceItems } from "../data/mock-marketplace";

const types = Array.from(new Set(marketplaceItems.map((i) => i.type)));
const rarities = Array.from(new Set(marketplaceItems.map((i) => i.rarity)));

export default function MarketplacePage() {
  const { settings } = useDashboard();
  const { glowEffects } = settings;
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeRarity, setActiveRarity] = useState<string | null>(null);

  const filtered = marketplaceItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !activeType || item.type === activeType;
    const matchesRarity = !activeRarity || item.rarity === activeRarity;
    return matchesSearch && matchesType && matchesRarity;
  });

  return (
    <main className="w-full min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl lg:max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
          </Link>
          <h1 className="text-lg font-semibold">Marketplace</h1>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-card ring-1 ring-border px-3 py-2 focus-within:ring-ring">
          <HugeiconsIcon icon={Search01Icon} size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveType(null)}
              className={`cursor-pointer text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-all duration-200 ring-1 ${
                !activeType ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground"
              }`}
            >
              All Types
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(activeType === type ? null : type)}
                className={`cursor-pointer text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-all duration-200 ring-1 ${
                  activeType === type ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {rarities.map((rarity) => {
              const rc = rarityColors[rarity];
              return (
                <button
                  key={rarity}
                  onClick={() => setActiveRarity(activeRarity === rarity ? null : rarity)}
                  className={`cursor-pointer text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full transition-all duration-200 ${
                    activeRarity === rarity ? "opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                  style={{ color: rc, backgroundColor: `${rc}20`, border: `1px solid ${rc}40` }}
                >
                  {rarity}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <ItemCard key={item.slug} item={item} glowEffects={glowEffects} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">No items found</p>
        )}
      </div>
    </main>
  );
}

function ItemCard({ item, glowEffects }: { item: MarketplaceItem; glowEffects: boolean }) {
  const rc = rarityColors[item.rarity];
  return (
    <Link
      href={`/dashboard/marketplace/${item.slug}`}
      className="group relative overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 hover:ring-primary/30 text-left block"
    >
      <div className="h-24 w-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center" style={{ background: item.gradient }}>
        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ color: rc, backgroundColor: `${rc}20`, border: `1px solid ${rc}40` }}>{item.rarity}</span>
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className="text-xs font-bold truncate" style={{ color: item.accent, textShadow: glowEffects ? `0 0 8px ${item.accent}60` : undefined }}>{item.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{item.type}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-bold text-foreground">{item.price}</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">$VIBE</span>
        </div>
      </div>
    </Link>
  );
}
