/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api, internal } from "./_generated/api";
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
  asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
): Promise<Id<"users">> {
  const user = await asUser.query(api.users.getMe, {});
  return user!._id;
}

describe("events: emit + getMyEvents", () => {
  it("emitted event is returned by getMyEvents", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "testEvent",
      payload: { foo: "bar" },
    });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("testEvent");
    expect(events[0].payload).toEqual({ foo: "bar" });
    expect(events[0].userId).toBe(aliceId);
  });

  it("returns multiple events for the same user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "event1",
      payload: { n: 1 },
    });
    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "event2",
      payload: { n: 2 },
    });
    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "event3",
      payload: { n: 3 },
    });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(3);
    const types = events.map((e) => e.type).sort();
    expect(types).toEqual(["event1", "event2", "event3"]);
  });
});

describe("events: dismiss", () => {
  it("dismissed event is removed from query results", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const eventId = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "testEvent",
      payload: {},
    });

    // Event exists
    let events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(1);

    // Dismiss it
    await asAlice.mutation(api.events.dismiss, { eventId });

    // Event gone
    events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(0);
  });

  it("dismissing already-dismissed event is a no-op", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const eventId = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "testEvent",
      payload: {},
    });

    await asAlice.mutation(api.events.dismiss, { eventId });
    // Should not throw
    await asAlice.mutation(api.events.dismiss, { eventId });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(0);
  });

  it("dismissing only removes the specific event", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const id1 = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "keep",
      payload: {},
    });
    const id2 = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "remove",
      payload: {},
    });

    await asAlice.mutation(api.events.dismiss, { eventId: id2 });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("keep");
  });
});

describe("events: user isolation", () => {
  it("user A cannot see user B events", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const aliceId = await getUserId(asAlice);
    const bobId = await getUserId(asBob);

    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "aliceOnly",
      payload: {},
    });
    await t.mutation(internal.events.emit, {
      userId: bobId,
      type: "bobOnly",
      payload: {},
    });

    const aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    expect(aliceEvents).toHaveLength(1);
    expect(aliceEvents[0].type).toBe("aliceOnly");

    const bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(bobEvents).toHaveLength(1);
    expect(bobEvents[0].type).toBe("bobOnly");
  });

  it("user A cannot dismiss user B events", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const eventId = await t.mutation(internal.events.emit, {
      userId: bobId,
      type: "bobEvent",
      payload: {},
    });

    await expect(
      asAlice.mutation(api.events.dismiss, { eventId }),
    ).rejects.toThrow("Not your event");

    // Bob's event still there
    const bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(bobEvents).toHaveLength(1);
  });
});

describe("events: flexible payload", () => {
  it("supports any JSON payload shape", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "complex",
      payload: {
        sessionId: "abc123",
        gameName: "Texas Hold'em",
        nested: { deep: true },
        list: [1, 2, 3],
      },
    });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events[0].payload.nested.deep).toBe(true);
    expect(events[0].payload.list).toEqual([1, 2, 3]);
  });

  it("supports null payload", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "simple",
      payload: null,
    });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(1);
    expect(events[0].payload).toBeNull();
  });
});

describe("events: gameStarted integration", () => {
  it("createAndStartForLobby emits gameStarted to all lobby members", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test Lobby",
      maxPlayers: 8,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    const sessionId = await asAlice.mutation(
      api.sessions.createAndStartForLobby,
      {
        lobbyId,
        gameName: "Texas Hold'em",
        maxPlayers: 8,
      },
    );

    // Both Alice and Bob should have gameStarted events
    const aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    const bobEvents = await asBob.query(api.events.getMyEvents, {});

    expect(aliceEvents.some((e) => e.type === "gameStarted")).toBe(true);
    expect(bobEvents.some((e) => e.type === "gameStarted")).toBe(true);

    const aliceEvent = aliceEvents.find((e) => e.type === "gameStarted")!;
    expect(aliceEvent.payload.sessionId).toBe(sessionId);
    expect(aliceEvent.payload.gameName).toBe("Texas Hold'em");

    const bobEvent = bobEvents.find((e) => e.type === "gameStarted")!;
    expect(bobEvent.payload.sessionId).toBe(sessionId);
  });
});

describe("events: gameEnded integration", () => {
  it("closePokerGame emits gameEnded to all session members", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Poker Lobby",
      maxPlayers: 8,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    const sessionId = await asAlice.mutation(
      api.sessions.createAndStartForLobby,
      {
        lobbyId,
        gameName: "Texas Hold'em",
        maxPlayers: 8,
      },
    );

    // Initialize poker
    await asAlice.mutation(api.poker.mutations.initializePokerGame, {
      sessionId,
    });

    // Dismiss the gameStarted events first
    const aliceStartEvents = await asAlice.query(api.events.getMyEvents, {});
    for (const e of aliceStartEvents) {
      await asAlice.mutation(api.events.dismiss, { eventId: e._id });
    }
    const bobStartEvents = await asBob.query(api.events.getMyEvents, {});
    for (const e of bobStartEvents) {
      await asBob.mutation(api.events.dismiss, { eventId: e._id });
    }

    // Play a hand to completion using test helper so we can close
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "fold",
    });

    // Now close the game
    await asAlice.mutation(api.poker.mutations.closePokerGame, { sessionId });

    // Both should have gameEnded events
    const aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    const bobEvents = await asBob.query(api.events.getMyEvents, {});

    expect(aliceEvents.some((e) => e.type === "gameEnded")).toBe(true);
    expect(bobEvents.some((e) => e.type === "gameEnded")).toBe(true);

    const aliceEnd = aliceEvents.find((e) => e.type === "gameEnded")!;
    expect(aliceEnd.payload.gameName).toBe("Texas Hold'em");
  });
});

describe("events: redirect lifecycle (race-condition safety)", () => {
  it("gameStarted event contains startedAt for countdown calculation", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Timer Lobby",
      maxPlayers: 8,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    const beforeStart = Date.now();
    await asAlice.mutation(api.sessions.createAndStartForLobby, {
      lobbyId,
      gameName: "Texas Hold'em",
      maxPlayers: 8,
    });

    const events = await asAlice.query(api.events.getMyEvents, {});
    const gameStarted = events.find((e) => e.type === "gameStarted");
    expect(gameStarted).toBeDefined();
    expect(gameStarted!.payload.startedAt).toBeTypeOf("number");
    expect(gameStarted!.payload.startedAt).toBeGreaterThanOrEqual(beforeStart);
  });

  it("dismiss after redirect does not leave stale events", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const eventId = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "gameStarted",
      payload: { sessionId: "fake", gameName: "Test", startedAt: Date.now() },
    });

    // Simulate: client processes event and dismisses it
    await asAlice.mutation(api.events.dismiss, { eventId });

    // No events should remain
    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events.filter((e) => e.type === "gameStarted")).toHaveLength(0);
  });

  it("double dismiss is safe (idempotent)", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const eventId = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "gameStarted",
      payload: { sessionId: "fake", gameName: "Test", startedAt: Date.now() },
    });

    // First dismiss
    await asAlice.mutation(api.events.dismiss, { eventId });
    // Second dismiss — should not throw
    await asAlice.mutation(api.events.dismiss, { eventId });

    const events = await asAlice.query(api.events.getMyEvents, {});
    expect(events).toHaveLength(0);
  });

  it("new events arriving after dismiss do not resurrect old ones", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    // Emit and dismiss first event
    const id1 = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "gameStarted",
      payload: { sessionId: "session1", gameName: "Game1", startedAt: Date.now() },
    });
    await asAlice.mutation(api.events.dismiss, { eventId: id1 });

    // Emit a second event
    await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "gameStarted",
      payload: { sessionId: "session2", gameName: "Game2", startedAt: Date.now() },
    });

    // Only the second event should exist
    const events = await asAlice.query(api.events.getMyEvents, {});
    const gameStartedEvents = events.filter((e) => e.type === "gameStarted");
    expect(gameStartedEvents).toHaveLength(1);
    expect(gameStartedEvents[0].payload.sessionId).toBe("session2");
  });

  it("concurrent events for different users are independent", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const aliceId = await getUserId(asAlice);
    const bobId = await getUserId(asBob);

    // Emit to both
    const aliceEventId = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "gameStarted",
      payload: { sessionId: "s1", gameName: "G1", startedAt: Date.now() },
    });
    await t.mutation(internal.events.emit, {
      userId: bobId,
      type: "gameStarted",
      payload: { sessionId: "s1", gameName: "G1", startedAt: Date.now() },
    });

    // Alice dismisses hers
    await asAlice.mutation(api.events.dismiss, { eventId: aliceEventId });

    // Alice has no events, Bob still has his
    const aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    const bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(aliceEvents.filter((e) => e.type === "gameStarted")).toHaveLength(0);
    expect(bobEvents.filter((e) => e.type === "gameStarted")).toHaveLength(1);
  });

  it("full game lifecycle: start → events emitted → dismiss → end → events emitted → dismiss", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    // Create lobby and start game
    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Full Lifecycle",
      maxPlayers: 8,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    const sessionId = await asAlice.mutation(
      api.sessions.createAndStartForLobby,
      { lobbyId, gameName: "Texas Hold'em", maxPlayers: 8 },
    );

    // Step 1: Both have gameStarted events
    let aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    let bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(aliceEvents.some((e) => e.type === "gameStarted")).toBe(true);
    expect(bobEvents.some((e) => e.type === "gameStarted")).toBe(true);

    // Step 2: Both dismiss their gameStarted events (simulate redirect completed)
    for (const e of aliceEvents) await asAlice.mutation(api.events.dismiss, { eventId: e._id });
    for (const e of bobEvents) await asBob.mutation(api.events.dismiss, { eventId: e._id });

    // Step 3: No events remain
    aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(aliceEvents).toHaveLength(0);
    expect(bobEvents).toHaveLength(0);

    // Step 4: Initialize and play poker to completion
    await asAlice.mutation(api.poker.mutations.initializePokerGame, { sessionId });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "fold",
    });

    // Step 5: Close game
    await asAlice.mutation(api.poker.mutations.closePokerGame, { sessionId });

    // Step 6: Both have gameEnded events
    aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(aliceEvents.some((e) => e.type === "gameEnded")).toBe(true);
    expect(bobEvents.some((e) => e.type === "gameEnded")).toBe(true);

    // Step 7: Dismiss gameEnded
    for (const e of aliceEvents) await asAlice.mutation(api.events.dismiss, { eventId: e._id });
    for (const e of bobEvents) await asBob.mutation(api.events.dismiss, { eventId: e._id });

    // Step 8: Clean slate
    aliceEvents = await asAlice.query(api.events.getMyEvents, {});
    bobEvents = await asBob.query(api.events.getMyEvents, {});
    expect(aliceEvents).toHaveLength(0);
    expect(bobEvents).toHaveLength(0);
  });
});

describe("events: unauthenticated access", () => {
  it("getMyEvents returns empty for unauthenticated user", async () => {
    const t = convexTest(schema, modules);
    const events = await t.query(api.events.getMyEvents, {});
    expect(events).toEqual([]);
  });

  it("dismiss throws for unauthenticated user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const eventId = await t.mutation(internal.events.emit, {
      userId: aliceId,
      type: "test",
      payload: {},
    });

    await expect(
      t.mutation(api.events.dismiss, { eventId }),
    ).rejects.toThrow("Not authenticated");
  });
});
