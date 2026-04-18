/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createUser(t: ReturnType<typeof convexTest>, name: string) {
  const asUser = t.withIdentity({
    name,
    preferredUsername: name.toLowerCase(),
    tokenIdentifier: `clerk|${name.toLowerCase()}`,
  });
  await asUser.mutation(api.users.getOrCreateUser, {});
  return asUser;
}

describe("presence.heartbeat", () => {
  it("creates presence on first call", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const presenceId = await asAlice.mutation(api.presence.heartbeat, {
      status: "online",
    });
    expect(presenceId).toBeDefined();
  });

  it("updates existing presence", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const id1 = await asAlice.mutation(api.presence.heartbeat, {
      status: "online",
    });
    const id2 = await asAlice.mutation(api.presence.heartbeat, {
      status: "in-game",
    });
    expect(id1).toEqual(id2);
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.presence.heartbeat, { status: "online" }),
    ).rejects.toThrowError("Not authenticated");
  });
});

describe("presence.markOffline", () => {
  it("marks stale users as offline", async () => {
    vi.useFakeTimers();

    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.presence.heartbeat, { status: "online" });

    // Advance past the 2-minute threshold
    vi.advanceTimersByTime(3 * 60 * 1000);

    await t.mutation(internal.presence.markOffline, {});

    // Check via friends query - presence should show offline
    // We can verify by reading the presence directly
    const user = await asAlice.query(api.users.getMe, {});
    const presence = await t.run(async (ctx) => {
      return await ctx.db
        .query("userPresence")
        .withIndex("by_userId", (q) => q.eq("userId", user!._id))
        .unique();
    });

    expect(presence!.status).toBe("offline");

    vi.useRealTimers();
  });

  it("does not mark recent users as offline", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.presence.heartbeat, { status: "online" });

    // Run markOffline immediately — should not change status
    await t.mutation(internal.presence.markOffline, {});

    const user = await asAlice.query(api.users.getMe, {});
    const presence = await t.run(async (ctx) => {
      return await ctx.db
        .query("userPresence")
        .withIndex("by_userId", (q) => q.eq("userId", user!._id))
        .unique();
    });

    expect(presence!.status).toBe("online");
  });
});
