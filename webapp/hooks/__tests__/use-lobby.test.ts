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
      rename: "api.lobbies.rename",
    },
    users: {
      getMe: "api.users.getMe",
      getOrCreateUser: "api.users.getOrCreateUser",
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
      if (ref === "api.lobbies.rename") return vi.fn();
      if (ref === "api.lobbies.getOrCreateMyLobby") return mockGetOrCreate;
      if (ref === "api.users.getOrCreateUser") return vi.fn();
      return vi.fn();
    });
    // Default: useQuery returns based on the ref
    mockUseQuery.mockImplementation((ref: string) => {
      if (ref === "api.users.getMe") return { _id: "currentUser" };
      if (ref === "api.lobbies.getMyLobby") return null;
      if (ref === "api.lobbies.listOpen") return [];
      return undefined;
    });
  });

  it("returns loading state when undefined", () => {
    mockUseQuery.mockImplementation((ref: string) => {
      if (ref === "api.users.getMe") return { _id: "currentUser" };
      return undefined; // lobbies queries loading
    });
    const { result } = renderHook(() => useLobby());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.myLobby).toBeNull();
  });

  it("returns lobby data when available", () => {
    const lobby = {
      lobby: { _id: "lobby1", name: "Test", hostId: "currentUser" },
      members: [{ membership: { role: "host" }, user: { _id: "currentUser" } }],
      sessions: [],
      messages: [],
    };
    mockUseQuery.mockImplementation((ref: string) => {
      if (ref === "api.users.getMe") return { _id: "currentUser" };
      if (ref === "api.lobbies.getMyLobby") return lobby;
      if (ref === "api.lobbies.listOpen") return [];
      return undefined;
    });
    const { result } = renderHook(() => useLobby());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.myLobby).toEqual(lobby);
    expect(result.current.isSolo).toBe(true);
    expect(result.current.isHost).toBe(true);
  });

  it("calls createNew", () => {
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.createNew("Game Night");
    });
    expect(mockCreate).toHaveBeenCalledWith({ name: "Game Night", maxPlayers: 20 });
  });

  it("calls join with lobbyId", () => {
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.join("lobby123" as any);
    });
    expect(mockJoin).toHaveBeenCalledWith({ lobbyId: "lobby123" });
  });

  it("calls kick with targetUserId", () => {
    const lobby = {
      lobby: { _id: "lobby1", name: "Test", hostId: "currentUser" },
      members: [
        { membership: { role: "host" }, user: { _id: "currentUser" } },
        { membership: { role: "member" }, user: { _id: "user2" } },
      ],
      sessions: [],
      messages: [],
    };
    mockUseQuery.mockImplementation((ref: string) => {
      if (ref === "api.users.getMe") return { _id: "currentUser" };
      if (ref === "api.lobbies.getMyLobby") return lobby;
      if (ref === "api.lobbies.listOpen") return [];
      return undefined;
    });
    const { result } = renderHook(() => useLobby());
    act(() => {
      result.current.kick("user2" as any);
    });
    expect(mockKick).toHaveBeenCalledWith({ lobbyId: "lobby1", targetUserId: "user2" });
  });

  it("auto-creates lobby when authenticated and no lobby", async () => {
    renderHook(() => useLobby());
    expect(mockGetOrCreate).toHaveBeenCalled();
  });

  it("does not auto-create when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false });
    renderHook(() => useLobby());
    expect(mockGetOrCreate).not.toHaveBeenCalled();
  });
});
