"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDashboard } from "../dashboard-context";
import { rarityColors } from "../lib/constants";
import type { MarketplaceItem } from "../types";

function ItemPreview({ item }: { item: MarketplaceItem }) {
  const { settings, user } = useDashboard();
  const { glowEffects } = settings;

  if (item.type === "Card Theme") {
    return (
      <div className="rounded-lg p-3" style={{ background: item.gradient, opacity: 0.7 }}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{user.fullName.charAt(0)}</div>
          <div>
            <p className="text-sm font-bold text-white">{user.fullName}</p>
            <p className="text-[10px] text-white/60">@{user.username}</p>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === "Avatar Border") {
    return (
      <div className="flex items-center justify-center py-4">
        <div
          className="size-20 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ background: item.gradient, boxShadow: glowEffects ? `0 0 20px ${item.accent}40` : undefined }}
        >
          <div className="size-[72px] rounded-full bg-card flex items-center justify-center text-foreground">{user.fullName.charAt(0)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4">
      <div
        className="px-4 py-2 rounded-full text-sm font-bold"
        style={{ color: item.accent, background: item.gradient, boxShadow: glowEffects ? `0 0 15px ${item.accent}40` : undefined }}
      >
        {item.name}
      </div>
    </div>
  );
}

export function ProductDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MarketplaceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings } = useDashboard();
  const { glowEffects } = settings;
  const [purchased, setPurchased] = useState(false);
  const rc = rarityColors[item.rarity];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPurchased(false); }}>
      <DialogContent className="sm:max-w-sm !p-0 gap-0 overflow-hidden">
        <div className="h-32 w-full flex items-center justify-center" style={{ background: item.gradient }}>
          <span
            className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full backdrop-blur-sm"
            style={{ color: rc, backgroundColor: `${rc}25`, border: `1px solid ${rc}50` }}
          >
            {item.rarity}
          </span>
        </div>

        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle
            className="text-base font-bold"
            style={{ color: item.accent, textShadow: glowEffects ? `0 0 12px ${item.accent}60` : undefined }}
          >
            {item.name}
          </DialogTitle>
          <DialogDescription className="text-xs">{item.type}</DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-3 pb-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-secondary ring-1 ring-border px-3 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Type</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{item.type}</p>
            </div>
            <div className="rounded-lg bg-secondary ring-1 ring-border px-3 py-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Rarity</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: rc }}>{item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-secondary ring-1 ring-border p-3 space-y-2">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Preview</p>
            <ItemPreview item={item} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-lg font-bold text-foreground">{item.price}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">$VIBE</p>
            </div>
            {purchased ? (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 ring-1 ring-primary/20 px-4 py-2 text-primary">
                <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2} />
                <span className="text-xs font-medium">Purchased</span>
              </div>
            ) : (
              <button
                onClick={() => setPurchased(true)}
                className="cursor-pointer flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-medium transition-all duration-200 hover:opacity-90"
              >
                <HugeiconsIcon icon={ShoppingBag02Icon} size={14} />
                Buy Now
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
