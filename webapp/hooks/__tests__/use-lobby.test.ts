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
    lobbies: {
      getMyLobby: "api.lobbies.getMyLobby",
      listOpen: "api.lobbies.listOpen",
      create: "api.lobbies.create",
      join: "api.lobbies.join",
      leave: "api.lobbies.leave",
    },
  },
}));

import { useLobby } from "../use-lobby";

describe("useLobby", () => {
  const mockCreate = vi.fn();
  const mockJoin = vi.fn();
  const mockLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((ref: string) => {
      if (ref === "api.lobbies.create") return mockCreate;
      if (ref === "api.lobbies.join") return mockJoin;
      if (ref === "api.lobbies.leave") return mockLeave;
      return vi.fn();
    });
  });

  it("returns loading state when undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useLobby());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.myLobby).toBeNull();
  });

  it("returns lobby data when available", () => {
    const lobby = { lobby: { _id: "lobby1", name: "Test" }, members: [], sessions: [], messages: [] };
    // First call is getMyLobby, second is listOpen
    mockUseQuery
      .mockReturnValueOnce(lobby)
      .mockReturnValueOnce([]);
    const { result } = renderHook(() => useLobby());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.myLobby).toEqual(lobby);
  });

  it("calls create with name and maxPlayers", () => {
    mockUseQuery.mockReturnValue(null);
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.create("Game Night", 20);
    });
    expect(mockCreate).toHaveBeenCalledWith({ name: "Game Night", maxPlayers: 20 });
  });

  it("calls join with lobbyId", () => {
    mockUseQuery.mockReturnValue(null);
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.join("lobby123" as any);
    });
    expect(mockJoin).toHaveBeenCalledWith({ lobbyId: "lobby123" });
  });
});
