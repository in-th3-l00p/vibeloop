"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useGames() {
  const games = useQuery(api.games.list);

  return {
    games: games ?? [],
    isLoading: games === undefined,
  };
}
