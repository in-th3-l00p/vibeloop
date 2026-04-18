/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { Id } from "./_generated/dataModel";

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

async function getUserId(
  t: ReturnType<typeof convexTest>,
  asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
): Promise<Id<"users">> {
  const user = await asUser.query(api.users.getMe, {});
  return user!._id;
}

async function setupLobbyWithPlayers(t: ReturnType<typeof convexTest>) {
  const asAlice = await createUser(t, "Alice");
  const asBob = await createUser(t, "Bob");
  const asCharlie = await createUser(t, "Charlie");

  const lobbyId = await asAlice.mutation(api.lobbies.create, {
    name: "Test Lobby",
    maxPlayers: 20,
  });
  await asBob.mutation(api.lobbies.join, { lobbyId });
  await asCharlie.mutation(api.lobbies.join, { lobbyId });

  return { asAlice, asBob, asCharlie, lobbyId };
}

describe("sessions.create", () => {
  it("creates session in lobby by host", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, lobbyId } = await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    expect(sessionId).toBeDefined();
  });

  it("rejects non-host from creating sessions", async () => {
    const t = convexTest(schema, modules);
    const { asBob, lobbyId } = await setupLobbyWithPlayers(t);

    await expect(
      asBob.mutation(api.sessions.create, {
        lobbyId,
        gameName: "Vibecheck",
        maxPlayers: 6,
      }),
    ).rejects.toThrowError("Only the lobby host can create sessions");
  });
});

describe("sessions.join", () => {
  it("adds player to session", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, lobbyId } = await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });

    await asBob.mutation(api.sessions.join, { sessionId });

    const sessions = await asAlice.query(api.sessions.getSessionsForLobby, {
      lobbyId,
    });
    expect(sessions[0].members).toHaveLength(1);
  });

  it("rejects non-lobby members", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, lobbyId } = await setupLobbyWithPlayers(t);
    const asOutsider = await createUser(t, "Outsider");

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });

    await expect(
      asOutsider.mutation(api.sessions.join, { sessionId }),
    ).rejects.toThrowError("Must be a lobby member to join a session");
  });

  it("enforces one-session-at-a-time rule", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, lobbyId } = await setupLobbyWithPlayers(t);

    const session1 = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    const session2 = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Wavelength",
      maxPlayers: 8,
    });

    await asBob.mutation(api.sessions.join, { sessionId: session1 });

    await expect(
      asBob.mutation(api.sessions.join, { sessionId: session2 }),
    ).rejects.toThrowError("Already in an active session");
  });

  it("rejects if session is full", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, asCharlie, lobbyId } =
      await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 1,
    });

    await asBob.mutation(api.sessions.join, { sessionId });

    await expect(
      asCharlie.mutation(api.sessions.join, { sessionId }),
    ).rejects.toThrowError("Session is full");
  });
});

describe("sessions.leave", () => {
  it("removes player from session", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, lobbyId } = await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });
    await asBob.mutation(api.sessions.leave, { sessionId });

    const mySession = await asBob.query(api.sessions.getMySession, {});
    expect(mySession).toBeNull();
  });
});

describe("sessions.setReady", () => {
  it("toggles ready status", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, lobbyId } = await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });

    const status1 = await asBob.mutation(api.sessions.setReady, { sessionId });
    expect(status1).toBe("ready");

    const status2 = await asBob.mutation(api.sessions.setReady, { sessionId });
    expect(status2).toBe("idle");
  });
});

describe("sessions.start", () => {
  it("transitions waiting to playing when all ready", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, asCharlie, lobbyId } =
      await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });
    await asCharlie.mutation(api.sessions.join, { sessionId });

    await asBob.mutation(api.sessions.setReady, { sessionId });
    await asCharlie.mutation(api.sessions.setReady, { sessionId });

    await asAlice.mutation(api.sessions.start, { sessionId });

    const sessions = await asAlice.query(api.sessions.getSessionsForLobby, {
      lobbyId,
    });
    expect(sessions[0].session.status).toBe("playing");
  });

  it("rejects if not all players ready", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, asCharlie, lobbyId } =
      await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });
    await asCharlie.mutation(api.sessions.join, { sessionId });
    await asBob.mutation(api.sessions.setReady, { sessionId });
    // Charlie is not ready

    await expect(
      asAlice.mutation(api.sessions.start, { sessionId }),
    ).rejects.toThrowError("Not all players are ready");
  });

  it("rejects if fewer than 2 players", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, lobbyId } = await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });
    await asBob.mutation(api.sessions.setReady, { sessionId });
    await asBob.mutation(api.sessions.leave, { sessionId });

    await expect(
      asAlice.mutation(api.sessions.start, { sessionId }),
    ).rejects.toThrowError("Need at least 2 players to start");
  });
});

describe("sessions.finish", () => {
  it("records results and updates gameStats", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, asCharlie, lobbyId } =
      await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });
    await asCharlie.mutation(api.sessions.join, { sessionId });
    await asBob.mutation(api.sessions.setReady, { sessionId });
    await asCharlie.mutation(api.sessions.setReady, { sessionId });
    await asAlice.mutation(api.sessions.start, { sessionId });

    const bobId = await getUserId(t, asBob);
    const charlieId = await getUserId(t, asCharlie);

    await asAlice.mutation(api.sessions.finish, {
      sessionId,
      results: [
        { userId: bobId, result: "win" },
        { userId: charlieId, result: "loss" },
      ],
    });

    // Check session is finished
    const sessions = await asAlice.query(api.sessions.getSessionsForLobby, {
      lobbyId,
    });
    expect(sessions[0].session.status).toBe("finished");

    // Check gameStats were created
    const bobStats = await asBob.query(api.gameStats.getMyStats, {});
    expect(bobStats).toHaveLength(1);
    expect(bobStats[0]).toMatchObject({
      gameName: "Vibecheck",
      played: 1,
      wins: 1,
    });

    const charlieStats = await asCharlie.query(api.gameStats.getMyStats, {});
    expect(charlieStats[0]).toMatchObject({
      gameName: "Vibecheck",
      played: 1,
      wins: 0,
    });
  });
});

describe("sessions.getMySession", () => {
  it("returns null when not in any session", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const result = await asAlice.query(api.sessions.getMySession, {});
    expect(result).toBeNull();
  });

  it("returns current active session", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, lobbyId } = await setupLobbyWithPlayers(t);

    const sessionId = await asAlice.mutation(api.sessions.create, {
      lobbyId,
      gameName: "Vibecheck",
      maxPlayers: 6,
    });
    await asBob.mutation(api.sessions.join, { sessionId });

    const mySession = await asBob.query(api.sessions.getMySession, {});
    expect(mySession).not.toBeNull();
    expect(mySession!.session.gameName).toBe("Vibecheck");
  });
});
