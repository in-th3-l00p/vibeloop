/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
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

describe("lobbies.getOrCreateMyLobby", () => {
  it("creates a solo lobby for a new user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const lobbyId = await asAlice.mutation(api.lobbies.getOrCreateMyLobby, {});
    expect(lobbyId).toBeDefined();

    const myLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(myLobby).not.toBeNull();
    expect(myLobby!.lobby.name).toBe("alice's Lobby");
    expect(myLobby!.members).toHaveLength(1);
    expect(myLobby!.members[0].membership.role).toBe("host");
  });

  it("returns existing lobby on second call", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const id1 = await asAlice.mutation(api.lobbies.getOrCreateMyLobby, {});
    const id2 = await asAlice.mutation(api.lobbies.getOrCreateMyLobby, {});
    expect(id1).toEqual(id2);
  });
});

describe("lobbies.create", () => {
  it("leaves old lobby and creates new one", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const oldId = await asAlice.mutation(api.lobbies.getOrCreateMyLobby, {});
    const newId = await asAlice.mutation(api.lobbies.create, {
      name: "Game Night",
      maxPlayers: 10,
    });

    expect(newId).not.toEqual(oldId);
    const myLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(myLobby!.lobby.name).toBe("Game Night");
  });
});

describe("lobbies.join", () => {
  it("joins another lobby and leaves current", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const aliceLobby = await asAlice.mutation(api.lobbies.create, {
      name: "Alice's Room",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.getOrCreateMyLobby, {});
    await asBob.mutation(api.lobbies.join, { lobbyId: aliceLobby });

    const bobLobby = await asBob.query(api.lobbies.getMyLobby, {});
    expect(bobLobby!.lobby._id).toEqual(aliceLobby);
    expect(bobLobby!.members).toHaveLength(2);
  });

  it("rejects if lobby is full", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const asCharlie = await createUser(t, "Charlie");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Tiny",
      maxPlayers: 2,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await expect(
      asCharlie.mutation(api.lobbies.join, { lobbyId }),
    ).rejects.toThrowError("Lobby is full");
  });
});

describe("lobbies.leave — host promotion", () => {
  it("promotes next member to host when host leaves", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await asAlice.mutation(api.lobbies.leave, { lobbyId });

    // Bob should now be host
    const bobLobby = await asBob.query(api.lobbies.getMyLobby, {});
    expect(bobLobby!.lobby.hostId).toBeDefined();
    expect(bobLobby!.members).toHaveLength(1);
    expect(bobLobby!.members[0].membership.role).toBe("host");

    // Alice should have a new solo lobby
    const aliceLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(aliceLobby).not.toBeNull();
    expect(aliceLobby!.lobby._id).not.toEqual(lobbyId);
  });

  it("closes lobby and creates solo lobby when last person leaves", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Solo",
      maxPlayers: 10,
    });
    await asAlice.mutation(api.lobbies.leave, { lobbyId });

    // Alice should be in a new solo lobby
    const aliceLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(aliceLobby).not.toBeNull();
    expect(aliceLobby!.lobby._id).not.toEqual(lobbyId);
  });
});

describe("lobbies.kick", () => {
  it("host can kick a member", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const bobUser = await asBob.query(api.users.getMe, {});

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await asAlice.mutation(api.lobbies.kick, {
      lobbyId,
      targetUserId: bobUser!._id,
    });

    // Alice alone in lobby
    const aliceLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(aliceLobby!.members).toHaveLength(1);

    // Bob in a new solo lobby
    const bobLobby = await asBob.query(api.lobbies.getMyLobby, {});
    expect(bobLobby).not.toBeNull();
    expect(bobLobby!.lobby._id).not.toEqual(lobbyId);
  });

  it("non-host cannot kick", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const aliceUser = await asAlice.query(api.users.getMe, {});

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await expect(
      asBob.mutation(api.lobbies.kick, {
        lobbyId,
        targetUserId: aliceUser!._id,
      }),
    ).rejects.toThrowError("Only the host can kick members");
  });

  it("cannot kick yourself", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceUser = await asAlice.query(api.users.getMe, {});

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await expect(
      asAlice.mutation(api.lobbies.kick, {
        lobbyId,
        targetUserId: aliceUser!._id,
      }),
    ).rejects.toThrowError("Cannot kick yourself");
  });
});

describe("lobbies.getMyLobby", () => {
  it("returns null when not in a lobby", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const result = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(result).toBeNull();
  });
});

describe("lobbies.listOpen", () => {
  it("only returns open lobbies", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    await asAlice.mutation(api.lobbies.create, {
      name: "Open Lobby",
      maxPlayers: 10,
    });

    const open = await t.query(api.lobbies.listOpen, {});
    expect(open.length).toBeGreaterThanOrEqual(1);
    expect(open.every((l: { isOpen: boolean }) => l.isOpen)).toBe(true);
  });
});
