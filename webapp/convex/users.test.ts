/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("getOrCreateUser", () => {
  it("creates a new user and default settings on first call", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice Smith",
      preferredUsername: "alice",
      givenName: "Alice",
      pictureUrl: "https://example.com/alice.jpg",
      tokenIdentifier: "clerk|alice123",
    });

    const userId = await asAlice.mutation(api.users.getOrCreateUser, {});
    expect(userId).toBeDefined();

    const user = await asAlice.query(api.users.getMe, {});
    expect(user).toMatchObject({
      tokenIdentifier: "clerk|alice123",
      username: "alice",
      fullName: "Alice Smith",
      firstName: "Alice",
      imageUrl: "https://example.com/alice.jpg",
      tag: "alice",
      bio: "",
      accent: "#a855f7",
      vibeBalance: 0,
    });

    const settings = await asAlice.query(api.settings.get, {});
    expect(settings).toMatchObject({
      profileCardTheme: "default",
      welcomeText: "Welcome, {{first_name}}",
      titleColor: "#ffffff",
      uiTheme: 0,
      showWelcome: true,
      showLobby: true,
      showGames: true,
      showMarketplace: true,
      compactMode: false,
      glowEffects: true,
    });
  });

  it("returns existing user on second call (idempotent)", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice123",
    });

    const firstId = await asAlice.mutation(api.users.getOrCreateUser, {});
    const secondId = await asAlice.mutation(api.users.getOrCreateUser, {});
    expect(firstId).toEqual(secondId);
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.users.getOrCreateUser, {}),
    ).rejects.toThrowError("Not authenticated");
  });
});

describe("getMe", () => {
  it("returns null for unauthenticated user", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.users.getMe, {});
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice123",
    });

    await asAlice.mutation(api.users.getOrCreateUser, {});
    const user = await asAlice.query(api.users.getMe, {});
    expect(user).not.toBeNull();
    expect(user!.tokenIdentifier).toBe("clerk|alice123");
  });

  it("returns null for authenticated user with no record", async () => {
    const t = convexTest(schema, modules);
    const asNew = t.withIdentity({
      name: "New User",
      tokenIdentifier: "clerk|new123",
    });
    const result = await asNew.query(api.users.getMe, {});
    expect(result).toBeNull();
  });
});

describe("updateProfile", () => {
  it("updates bio and accent", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice123",
    });
    await asAlice.mutation(api.users.getOrCreateUser, {});

    await asAlice.mutation(api.users.updateProfile, {
      bio: "Hello world",
      accent: "#ff0000",
    });

    const user = await asAlice.query(api.users.getMe, {});
    expect(user!.bio).toBe("Hello world");
    expect(user!.accent).toBe("#ff0000");
  });

  it("rejects duplicate tag", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      preferredUsername: "alice",
      tokenIdentifier: "clerk|alice123",
    });
    const asBob = t.withIdentity({
      name: "Bob",
      preferredUsername: "bob",
      tokenIdentifier: "clerk|bob123",
    });

    await asAlice.mutation(api.users.getOrCreateUser, {});
    await asBob.mutation(api.users.getOrCreateUser, {});

    await expect(
      asBob.mutation(api.users.updateProfile, { tag: "alice" }),
    ).rejects.toThrowError("Tag already taken");
  });

  it("allows user to keep their own tag", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      preferredUsername: "alice",
      tokenIdentifier: "clerk|alice123",
    });

    await asAlice.mutation(api.users.getOrCreateUser, {});

    // Should not throw - same user keeping same tag
    await asAlice.mutation(api.users.updateProfile, { tag: "alice" });
    const user = await asAlice.query(api.users.getMe, {});
    expect(user!.tag).toBe("alice");
  });

  it("normalizes tag to lowercase alphanumeric", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice123",
    });
    await asAlice.mutation(api.users.getOrCreateUser, {});

    await asAlice.mutation(api.users.updateProfile, {
      tag: "Cool_Player-99!@#",
    });

    const user = await asAlice.query(api.users.getMe, {});
    expect(user!.tag).toBe("cool_player-99");
  });

  it("rejects empty tag", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice123",
    });
    await asAlice.mutation(api.users.getOrCreateUser, {});

    await expect(
      asAlice.mutation(api.users.updateProfile, { tag: "!!!" }),
    ).rejects.toThrowError("Tag cannot be empty");
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.users.updateProfile, { bio: "test" }),
    ).rejects.toThrowError("Not authenticated");
  });
});

describe("linkWallet", () => {
  it("stores wallet address", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice123",
    });
    await asAlice.mutation(api.users.getOrCreateUser, {});

    await asAlice.mutation(api.users.linkWallet, {
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    });

    const user = await asAlice.query(api.users.getMe, {});
    expect(user!.walletAddress).toBe(
      "0x1234567890abcdef1234567890abcdef12345678",
    );
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.users.linkWallet, { walletAddress: "0x123" }),
    ).rejects.toThrowError("Not authenticated");
  });
});
