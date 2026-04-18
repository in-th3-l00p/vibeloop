"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useUserSearch(query: string) {
  const results = useQuery(
    api.users.search,
    query.trim().length > 0 ? { query: query.trim() } : "skip",
  );

  return {
    results: results ?? [],
    isLoading: query.trim().length > 0 && results === undefined,
  };
}
