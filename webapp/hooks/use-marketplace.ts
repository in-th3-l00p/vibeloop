"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useMarketplace() {
  const items = useQuery(api.marketplace.list);

  return {
    items: items ?? [],
    isLoading: items === undefined,
  };
}
