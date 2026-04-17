"use client";

import { use, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ShoppingBag02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useDashboard } from "../../dashboard-context";
import { rarityColors } from "../../lib/constants";
import { marketplaceItems } from "../../data/mock-marketplace";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { settings, user } = useDashboard();
  const { glowEffects } = settings;
  const [purchased, setPurchased] = useState(false);

  const item = marketplaceItems.find((i) => i.slug === slug);

  if (!item) {
    return (
      <main className="w-full min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Item not found</p>
          <Link href="/dashboard/marketplace" className="text-primary text-sm hover:underline">Back to Marketplace</Link>
        </div>
      </main>
    );
  }

  const rc = rarityColors[item.rarity];
  const related = marketplaceItems.filter((i) => i.slug !== item.slug && i.type === item.type).slice(0, 4);

  return (
    <main className="w-full min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl lg:max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
          </Link>
          <p className="text-xs text-muted-foreground">{item.type}</p>
        </div>

        <div className="rounded-xl overflow-hidden bg-card ring-1 ring-border">
          <div
            className="h-40 sm:h-56 w-full flex items-center justify-center relative"
            style={{ background: item.gradient }}
          >
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full backdrop-blur-sm"
              style={{ color: rc, backgroundColor: `${rc}25`, border: `1px solid ${rc}50` }}
            >
              {item.rarity}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    color: item.accent,
                    textShadow: glowEffects ? `0 0 12px ${item.accent}60` : undefined,
                  }}
                >
                  {item.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{item.type}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-foreground">{item.price}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">$VIBE</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>

            <div className="flex gap-3 pt-2">
              {purchased ? (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary/10 ring-1 ring-primary/20 py-2.5 text-primary">
                  <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2} />
                  <span className="text-xs font-medium">Purchased</span>
                </div>
              ) : (
                <button
                  onClick={() => setPurchased(true)}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium transition-all duration-200 hover:opacity-90"
                >
                  <HugeiconsIcon icon={ShoppingBag02Icon} size={16} />
                  Buy for {item.price} $VIBE
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-card ring-1 ring-border px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{item.type}</p>
            </div>
            <div className="rounded-lg bg-card ring-1 ring-border px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rarity</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: rc }}>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</p>
            </div>
          </div>

          {item.type === "Card Theme" && (
            <div className="rounded-lg bg-card ring-1 ring-border p-4 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</p>
              <div className="rounded-lg p-3" style={{ background: item.gradient, opacity: 0.7 }}>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.fullName}</p>
                    <p className="text-[10px] text-white/60">@{user.username}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {item.type === "Avatar Border" && (
            <div className="rounded-lg bg-card ring-1 ring-border p-4 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</p>
              <div className="flex items-center justify-center py-4">
                <div
                  className="size-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: item.gradient,
                    boxShadow: glowEffects ? `0 0 20px ${item.accent}40` : undefined,
                  }}
                >
                  <div className="size-[72px] rounded-full bg-card flex items-center justify-center text-foreground">
                    {user.fullName.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {item.type === "Badge" && (
            <div className="rounded-lg bg-card ring-1 ring-border p-4 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</p>
              <div className="flex items-center justify-center py-4">
                <div
                  className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{
                    color: item.accent,
                    background: item.gradient,
                    boxShadow: glowEffects ? `0 0 15px ${item.accent}40` : undefined,
                  }}
                >
                  {item.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">More {item.type}s</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {related.map((rel) => {
                const relRc = rarityColors[rel.rarity];
                return (
                  <Link
                    key={rel.slug}
                    href={`/dashboard/marketplace/${rel.slug}`}
                    className="group overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 hover:ring-primary/30 block"
                  >
                    <div className="h-16 w-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center" style={{ background: rel.gradient }}>
                      <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm" style={{ color: relRc, backgroundColor: `${relRc}20`, border: `1px solid ${relRc}40` }}>{rel.rarity}</span>
                    </div>
                    <div className="px-2.5 pb-2.5 pt-1.5">
                      <p className="text-[11px] font-bold truncate" style={{ color: rel.accent }}>{rel.name}</p>
                      <p className="text-[9px] text-muted-foreground">{rel.price} $VIBE</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
