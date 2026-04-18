import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

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
    users: {
      getMe: "api.users.getMe",
      getOrCreateUser: "api.users.getOrCreateUser",
    },
  },
}));

import { useCurrentUser } from "../use-current-user";

describe("useCurrentUser", () => {
  const mockGetOrCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mockGetOrCreate);
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true });
  });

  it("returns isLoading=true when query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();
  });

  it("returns isLoading=true when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false });
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.isLoading).toBe(true);
  });

  it("calls getOrCreateUser when authenticated and user is null", async () => {
    mockUseQuery.mockReturnValue(null);
    renderHook(() => useCurrentUser());
    await waitFor(() => {
      expect(mockGetOrCreate).toHaveBeenCalled();
    });
  });

  it("does not call getOrCreateUser when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false });
    mockUseQuery.mockReturnValue(null);
    renderHook(() => useCurrentUser());
    expect(mockGetOrCreate).not.toHaveBeenCalled();
  });

  it("returns user data when available", () => {
    const mockUser = {
      _id: "123",
      username: "alice",
      fullName: "Alice Smith",
      firstName: "Alice",
      imageUrl: "https://example.com/alice.jpg",
      tag: "alice",
      bio: "Hello",
      accent: "#a855f7",
      vibeBalance: 100,
    };
    mockUseQuery.mockReturnValue(mockUser);
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it("does not call getOrCreateUser when user exists", () => {
    mockUseQuery.mockReturnValue({ _id: "123", username: "alice" });
    renderHook(() => useCurrentUser());
    expect(mockGetOrCreate).not.toHaveBeenCalled();
  });
});
