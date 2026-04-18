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

describe("lobbies.create", () => {
  it("creates lobby and adds host as member", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Friday Games",
      maxPlayers: 20,
    });
    expect(lobbyId).toBeDefined();

    const myLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(myLobby).not.toBeNull();
    expect(myLobby!.lobby.name).toBe("Friday Games");
    expect(myLobby!.members).toHaveLength(1);
    expect(myLobby!.members[0].membership.role).toBe("host");
  });
});

describe("lobbies.join", () => {
  it("adds member to lobby", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await asBob.mutation(api.lobbies.join, { lobbyId });

    const myLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(myLobby!.members).toHaveLength(2);
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

  it("rejects if lobby is closed", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    // Host leaves, closing the lobby
    await asAlice.mutation(api.lobbies.leave, { lobbyId });

    await expect(
      asBob.mutation(api.lobbies.join, { lobbyId }),
    ).rejects.toThrowError("Lobby is closed");
  });

  it("rejects duplicate join", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await expect(
      asBob.mutation(api.lobbies.join, { lobbyId }),
    ).rejects.toThrowError("Already in this lobby");
  });
});

describe("lobbies.leave", () => {
  it("removes member", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });
    await asBob.mutation(api.lobbies.leave, { lobbyId });

    const myLobby = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(myLobby!.members).toHaveLength(1);
  });

  it("host leaving closes lobby and removes all members", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await asAlice.mutation(api.lobbies.leave, { lobbyId });

    const bobLobby = await asBob.query(api.lobbies.getMyLobby, {});
    expect(bobLobby).toBeNull();
  });
});

describe("lobbies.listOpen", () => {
  it("only returns open lobbies", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobby1 = await asAlice.mutation(api.lobbies.create, {
      name: "Open Lobby",
      maxPlayers: 10,
    });
    const lobby2 = await asBob.mutation(api.lobbies.create, {
      name: "Will Close",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.leave, { lobbyId: lobby2 });

    const open = await t.query(api.lobbies.listOpen, {});
    expect(open).toHaveLength(1);
    expect(open[0].name).toBe("Open Lobby");
  });
});

describe("lobbies.getMyLobby", () => {
  it("returns null when not in a lobby", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const result = await asAlice.query(api.lobbies.getMyLobby, {});
    expect(result).toBeNull();
  });

  it("returns null for unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.lobbies.getMyLobby, {});
    expect(result).toBeNull();
  });
});
