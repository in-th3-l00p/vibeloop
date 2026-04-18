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
    settings: {
      get: "api.settings.get",
      update: "api.settings.update",
      reset: "api.settings.reset",
    },
  },
}));

import { useUserSettings } from "../use-user-settings";

describe("useUserSettings", () => {
  const mockUpdate = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((ref: string) => {
      if (ref === "api.settings.update") return mockUpdate;
      if (ref === "api.settings.reset") return mockReset;
      return vi.fn();
    });
  });

  it("returns defaults when query is undefined (loading)", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useUserSettings());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.settings.profileCardTheme).toBe("default");
    expect(result.current.settings.glowEffects).toBe(true);
  });

  it("returns settings from Convex when available", () => {
    mockUseQuery.mockReturnValue({
      profileCardTheme: "neon-pulse",
      welcomeText: "Hey {{first_name}}",
      titleColor: "#ff0000",
      uiTheme: 2,
      showWelcome: false,
      showLobby: true,
      showGames: true,
      showMarketplace: false,
      compactMode: true,
      glowEffects: false,
    });
    const { result } = renderHook(() => useUserSettings());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.settings.profileCardTheme).toBe("neon-pulse");
    expect(result.current.settings.compactMode).toBe(true);
    expect(result.current.settings.glowEffects).toBe(false);
  });

  it("calls update mutation with key/value", () => {
    mockUseQuery.mockReturnValue({
      profileCardTheme: "default",
      welcomeText: "Welcome",
      titleColor: "#fff",
      uiTheme: 0,
      showWelcome: true,
      showLobby: true,
      showGames: true,
      showMarketplace: true,
      compactMode: false,
      glowEffects: true,
    });
    const { result } = renderHook(() => useUserSettings());
    act(() => {
      result.current.update("compactMode", true);
    });
    expect(mockUpdate).toHaveBeenCalledWith({ key: "compactMode", value: true });
  });

  it("calls reset mutation", () => {
    mockUseQuery.mockReturnValue({
      profileCardTheme: "default",
      welcomeText: "Welcome",
      titleColor: "#fff",
      uiTheme: 0,
      showWelcome: true,
      showLobby: true,
      showGames: true,
      showMarketplace: true,
      compactMode: false,
      glowEffects: true,
    });
    const { result } = renderHook(() => useUserSettings());
    act(() => {
      result.current.reset();
    });
    expect(mockReset).toHaveBeenCalled();
  });
});
