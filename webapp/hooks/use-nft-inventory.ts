"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useNftInventory() {
  const inventory = useQuery(api.nft.getMyInventory);

  function ownsSlug(slug: string) {
    return inventory?.some((item) => item.itemSlug === slug) ?? false;
  }

  return {
    inventory: inventory ?? [],
    isLoading: inventory === undefined,
    ownsSlug,
  };
}
