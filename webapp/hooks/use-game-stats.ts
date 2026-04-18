"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useGameStats() {
  const stats = useQuery(api.gameStats.getMyStats);

  const totalPlayed = stats?.reduce((sum, s) => sum + s.played, 0) ?? 0;
  const totalWins = stats?.reduce((sum, s) => sum + s.wins, 0) ?? 0;
  const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

  return {
    stats: stats ?? [],
    totalPlayed,
    totalWins,
    winRate,
    isLoading: stats === undefined,
  };
}
