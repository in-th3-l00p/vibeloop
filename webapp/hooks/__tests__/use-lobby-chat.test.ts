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
    chat: {
      list: "api.chat.list",
      send: "api.chat.send",
    },
  },
}));

import { useLobbyChat } from "../use-lobby-chat";

describe("useLobbyChat", () => {
  const mockSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mockSend);
  });

  it("skips query when lobbyId is null", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useLobbyChat(null));
    expect(result.current.messages).toEqual([]);
    expect(mockUseQuery).toHaveBeenCalledWith("api.chat.list", "skip");
  });

  it("returns messages when available", () => {
    const msgs = [
      { _id: "1", text: "Hello", username: "alice", accent: "#fff", _creationTime: 1000 },
    ];
    mockUseQuery.mockReturnValue(msgs);
    const { result } = renderHook(() => useLobbyChat("lobby1" as any));
    expect(result.current.messages).toEqual(msgs);
    expect(result.current.isLoading).toBe(false);
  });

  it("calls send mutation with lobbyId and text", () => {
    mockUseQuery.mockReturnValue([]);
    const { result } = renderHook(() => useLobbyChat("lobby1" as any));
    act(() => {
      result.current.send("Hello world");
    });
    expect(mockSend).toHaveBeenCalledWith({ lobbyId: "lobby1", text: "Hello world" });
  });

  it("does not call send when lobbyId is null", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useLobbyChat(null));
    act(() => {
      result.current.send("Hello");
    });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
