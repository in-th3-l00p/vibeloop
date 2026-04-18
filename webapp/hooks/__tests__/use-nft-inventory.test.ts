import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    nft: { getMyInventory: "api.nft.getMyInventory" },
  },
}));

import { useNftInventory } from "../use-nft-inventory";

describe("useNftInventory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns loading state when undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useNftInventory());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.inventory).toEqual([]);
  });

  it("returns inventory items", () => {
    const items = [
      { itemSlug: "neon-pulse", tokenId: "42" },
      { itemSlug: "cosmic-drift", tokenId: "99" },
    ];
    mockUseQuery.mockReturnValue(items);
    const { result } = renderHook(() => useNftInventory());
    expect(result.current.inventory).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("ownsSlug returns true for owned items", () => {
    mockUseQuery.mockReturnValue([
      { itemSlug: "neon-pulse", tokenId: "42" },
    ]);
    const { result } = renderHook(() => useNftInventory());
    expect(result.current.ownsSlug("neon-pulse")).toBe(true);
    expect(result.current.ownsSlug("cosmic-drift")).toBe(false);
  });

  it("ownsSlug returns false when loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useNftInventory());
    expect(result.current.ownsSlug("neon-pulse")).toBe(false);
  });
});
