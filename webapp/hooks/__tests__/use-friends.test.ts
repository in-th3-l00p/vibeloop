import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    friends: {
      listFriends: "api.friends.listFriends",
      sendRequest: "api.friends.sendRequest",
      acceptRequest: "api.friends.acceptRequest",
      removeFriend: "api.friends.removeFriend",
    },
  },
}));

import { useFriends } from "../use-friends";

describe("useFriends", () => {
  const mockSendRequest = vi.fn();
  const mockAcceptRequest = vi.fn();
  const mockRemoveFriend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((ref: string) => {
      if (ref === "api.friends.sendRequest") return mockSendRequest;
      if (ref === "api.friends.acceptRequest") return mockAcceptRequest;
      if (ref === "api.friends.removeFriend") return mockRemoveFriend;
      return vi.fn();
    });
  });

  it("returns loading state when undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useFriends());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.friends).toEqual([]);
    expect(result.current.onlineCount).toBe(0);
  });

  it("counts online friends", () => {
    mockUseQuery.mockReturnValue([
      { user: { _id: "1" }, presence: { status: "online" } },
      { user: { _id: "2" }, presence: { status: "offline" } },
      { user: { _id: "3" }, presence: { status: "in-game" } },
    ]);
    const { result } = renderHook(() => useFriends());
    expect(result.current.onlineCount).toBe(2);
    expect(result.current.totalCount).toBe(3);
  });

  it("calls sendRequest with target user id", () => {
    mockUseQuery.mockReturnValue([]);
    const { result } = renderHook(() => useFriends());
    act(() => {
      result.current.sendRequest("user123" as any);
    });
    expect(mockSendRequest).toHaveBeenCalledWith({ targetUserId: "user123" });
  });

  it("calls acceptRequest with friendship id", () => {
    mockUseQuery.mockReturnValue([]);
    const { result } = renderHook(() => useFriends());
    act(() => {
      result.current.acceptRequest("friendship123" as any);
    });
    expect(mockAcceptRequest).toHaveBeenCalledWith({ friendshipId: "friendship123" });
  });
});
