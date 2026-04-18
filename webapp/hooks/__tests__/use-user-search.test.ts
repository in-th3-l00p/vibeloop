import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: { search: "api.users.search" },
  },
}));

import { useUserSearch } from "../use-user-search";

describe("useUserSearch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips query when input is empty", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useUserSearch(""));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockUseQuery).toHaveBeenCalledWith("api.users.search", "skip");
  });

  it("skips query when input is only whitespace", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useUserSearch("   "));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns loading when query is pending", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useUserSearch("alice"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.results).toEqual([]);
  });

  it("returns results from Convex", () => {
    const users = [
      { _id: "1", username: "alice", tag: "alice", accent: "#a855f7" },
      { _id: "2", username: "alicia", tag: "alicia", accent: "#22d3ee" },
    ];
    mockUseQuery.mockReturnValue(users);
    const { result } = renderHook(() => useUserSearch("ali"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toHaveLength(2);
    expect(result.current.results[0].username).toBe("alice");
  });

  it("returns empty array when no matches", () => {
    mockUseQuery.mockReturnValue([]);
    const { result } = renderHook(() => useUserSearch("zzzzz"));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
