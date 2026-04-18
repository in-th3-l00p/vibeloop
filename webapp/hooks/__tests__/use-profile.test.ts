import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      updateProfile: "api.users.updateProfile",
      linkWallet: "api.users.linkWallet",
    },
  },
}));

import { useProfile } from "../use-profile";

describe("useProfile", () => {
  const mockUpdateProfile = vi.fn();
  const mockLinkWallet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((ref: string) => {
      if (ref === "api.users.updateProfile") return mockUpdateProfile;
      if (ref === "api.users.linkWallet") return mockLinkWallet;
      return vi.fn();
    });
  });

  it("calls updateProfile with provided updates", () => {
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.updateProfile({ bio: "New bio", accent: "#ff0000" });
    });
    expect(mockUpdateProfile).toHaveBeenCalledWith({ bio: "New bio", accent: "#ff0000" });
  });

  it("calls linkWallet with address", () => {
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.linkWallet("0xABC123");
    });
    expect(mockLinkWallet).toHaveBeenCalledWith({ walletAddress: "0xABC123" });
  });
});
