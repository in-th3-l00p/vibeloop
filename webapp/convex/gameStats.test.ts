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

describe("gameStats.getMyStats", () => {
  it("returns empty for new user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const stats = await asAlice.query(api.gameStats.getMyStats, {});
    expect(stats).toEqual([]);
  });

  it("returns empty for unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const stats = await t.query(api.gameStats.getMyStats, {});
    expect(stats).toEqual([]);
  });
});

describe("gameStats.recordGame", () => {
  it("creates new stat entry on first play", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: true,
    });

    const stats = await asAlice.query(api.gameStats.getMyStats, {});
    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({
      gameName: "Vibecheck",
      played: 1,
      wins: 1,
    });
  });

  it("increments existing stats (upsert)", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: true,
    });
    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: false,
    });
    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: true,
    });

    const stats = await asAlice.query(api.gameStats.getMyStats, {});
    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({
      gameName: "Vibecheck",
      played: 3,
      wins: 2,
    });
  });

  it("isolates stats per user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: true,
    });
    await asBob.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: false,
    });

    const aliceStats = await asAlice.query(api.gameStats.getMyStats, {});
    const bobStats = await asBob.query(api.gameStats.getMyStats, {});

    expect(aliceStats[0].wins).toBe(1);
    expect(bobStats[0].wins).toBe(0);
  });

  it("tracks multiple games separately", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Vibecheck",
      won: true,
    });
    await asAlice.mutation(api.gameStats.recordGame, {
      gameName: "Wavelength",
      won: false,
    });

    const stats = await asAlice.query(api.gameStats.getMyStats, {});
    expect(stats).toHaveLength(2);
  });
});
