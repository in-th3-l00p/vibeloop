import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    gameStats: { getMyStats: "api.gameStats.getMyStats" },
  },
}));

import { useGameStats } from "../use-game-stats";

describe("useGameStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns loading state with zero stats when undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useGameStats());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.totalPlayed).toBe(0);
    expect(result.current.totalWins).toBe(0);
    expect(result.current.winRate).toBe(0);
    expect(result.current.stats).toEqual([]);
  });

  it("computes totals from stats", () => {
    mockUseQuery.mockReturnValue([
      { gameName: "Vibecheck", played: 10, wins: 7 },
      { gameName: "Wavelength", played: 5, wins: 2 },
    ]);
    const { result } = renderHook(() => useGameStats());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalPlayed).toBe(15);
    expect(result.current.totalWins).toBe(9);
    expect(result.current.winRate).toBe(60);
    expect(result.current.stats).toHaveLength(2);
  });

  it("returns 0% win rate when no games played", () => {
    mockUseQuery.mockReturnValue([]);
    const { result } = renderHook(() => useGameStats());
    expect(result.current.winRate).toBe(0);
  });
});
