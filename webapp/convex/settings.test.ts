/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createUser(t: ReturnType<typeof convexTest>, name: string) {
  const asUser = t.withIdentity({
    name,
    tokenIdentifier: `clerk|${name.toLowerCase()}`,
  });
  await asUser.mutation(api.users.getOrCreateUser, {});
  return asUser;
}

describe("settings.get", () => {
  it("returns defaults for a new user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

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

  it("returns null for unauthenticated user", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.settings.get, {});
    expect(result).toBeNull();
  });

  it("returns null for authenticated user with no record", async () => {
    const t = convexTest(schema, modules);
    const asNew = t.withIdentity({
      name: "New",
      tokenIdentifier: "clerk|new",
    });
    const result = await asNew.query(api.settings.get, {});
    expect(result).toBeNull();
  });
});

describe("settings.update", () => {
  it("patches a single boolean field", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.settings.update, {
      key: "compactMode",
      value: true,
    });

    const settings = await asAlice.query(api.settings.get, {});
    expect(settings!.compactMode).toBe(true);
    // Other fields unchanged
    expect(settings!.glowEffects).toBe(true);
    expect(settings!.showWelcome).toBe(true);
  });

  it("patches a string field", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.settings.update, {
      key: "titleColor",
      value: "#ff00ff",
    });

    const settings = await asAlice.query(api.settings.get, {});
    expect(settings!.titleColor).toBe("#ff00ff");
  });

  it("patches a number field", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.settings.update, {
      key: "uiTheme",
      value: 3,
    });

    const settings = await asAlice.query(api.settings.get, {});
    expect(settings!.uiTheme).toBe(3);
  });

  it("rejects invalid setting key", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await expect(
      asAlice.mutation(api.settings.update, {
        key: "nonExistentKey",
        value: true,
      }),
    ).rejects.toThrowError("Invalid setting key");
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.settings.update, { key: "compactMode", value: true }),
    ).rejects.toThrowError("Not authenticated");
  });
});

describe("settings.reset", () => {
  it("restores all defaults", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    // Change some settings
    await asAlice.mutation(api.settings.update, {
      key: "compactMode",
      value: true,
    });
    await asAlice.mutation(api.settings.update, {
      key: "titleColor",
      value: "#ff0000",
    });
    await asAlice.mutation(api.settings.update, {
      key: "uiTheme",
      value: 5,
    });

    // Reset
    await asAlice.mutation(api.settings.reset, {});

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

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.settings.reset, {}),
    ).rejects.toThrowError("Not authenticated");
  });
});
