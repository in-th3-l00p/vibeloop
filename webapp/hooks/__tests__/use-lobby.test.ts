import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseConvexAuth = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useConvexAuth: () => mockUseConvexAuth(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    lobbies: {
      getMyLobby: "api.lobbies.getMyLobby",
      listOpen: "api.lobbies.listOpen",
      getOrCreateMyLobby: "api.lobbies.getOrCreateMyLobby",
      create: "api.lobbies.create",
      join: "api.lobbies.join",
      leave: "api.lobbies.leave",
      kick: "api.lobbies.kick",
    },
  },
}));

import { useLobby } from "../use-lobby";

describe("useLobby", () => {
  const mockCreate = vi.fn();
  const mockJoin = vi.fn();
  const mockLeave = vi.fn();
  const mockKick = vi.fn();
  const mockGetOrCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true });
    mockUseMutation.mockImplementation((ref: string) => {
      if (ref === "api.lobbies.create") return mockCreate;
      if (ref === "api.lobbies.join") return mockJoin;
      if (ref === "api.lobbies.leave") return mockLeave;
      if (ref === "api.lobbies.kick") return mockKick;
      if (ref === "api.lobbies.getOrCreateMyLobby") return mockGetOrCreate;
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
    const lobby = {
      lobby: { _id: "lobby1", name: "Test", hostId: "user1" },
      members: [{ membership: { role: "host" }, user: { _id: "user1" } }],
      sessions: [],
      messages: [],
    };
    mockUseQuery.mockReturnValueOnce(lobby).mockReturnValueOnce([]);
    const { result } = renderHook(() => useLobby());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.myLobby).toEqual(lobby);
    expect(result.current.isSolo).toBe(true);
  });

  it("calls createNew", () => {
    mockUseQuery.mockReturnValue(null);
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.createNew("Game Night");
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

  it("calls kick with targetUserId", () => {
    const lobby = {
      lobby: { _id: "lobby1", name: "Test", hostId: "user1" },
      members: [
        { membership: { role: "host" }, user: { _id: "user1" } },
        { membership: { role: "member" }, user: { _id: "user2" } },
      ],
      sessions: [],
      messages: [],
    };
    mockUseQuery.mockReturnValueOnce(lobby).mockReturnValueOnce([]);
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.kick("user2" as any);
    });
    expect(mockKick).toHaveBeenCalledWith({ lobbyId: "lobby1", targetUserId: "user2" });
  });

  it("auto-creates lobby when authenticated and no lobby", async () => {
    mockUseQuery.mockReturnValue(null);
    renderHook(() => useLobby());
    expect(mockGetOrCreate).toHaveBeenCalled();
  });

  it("does not auto-create when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false });
    mockUseQuery.mockReturnValue(null);
    renderHook(() => useLobby());
    expect(mockGetOrCreate).not.toHaveBeenCalled();
  });
});
