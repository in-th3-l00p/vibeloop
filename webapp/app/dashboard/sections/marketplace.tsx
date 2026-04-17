"use client";

import { useState } from "react";
import { useDashboard } from "../dashboard-context";
import { SectionHeader } from "../components/ui/section-header";
import { ScrollRow } from "../components/ui/scroll-row";
import { ItemCard } from "../components/item-card";
import { ProductDialog } from "../components/product-dialog";
import { marketplaceItems } from "../data/mock-marketplace";
import type { MarketplaceItem } from "../types";

export function Marketplace() {
  const { settings } = useDashboard();
  const { compactMode } = settings;
  const [selected, setSelected] = useState<MarketplaceItem | null>(null);

  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <SectionHeader title="Marketplace" action="Browse All" href="/dashboard/marketplace" />
      <ScrollRow>
        {marketplaceItems.map((item) => (
          <ItemCard key={item.slug} item={item} size={compactMode ? "compact" : "default"} onClick={() => setSelected(item)} />
        ))}
      </ScrollRow>
      {selected && (
        <ProductDialog item={selected} open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
      )}
    </div>
  );
}
