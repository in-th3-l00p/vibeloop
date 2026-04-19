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

async function setupPokerGame(t: ReturnType<typeof convexTest>) {
  const asAlice = await createUser(t, "Alice");
  const asBob = await createUser(t, "Bob");

  // Create lobby with 2 players
  const lobbyId = await asAlice.mutation(api.lobbies.create, {
    name: "Poker Lobby",
    maxPlayers: 8,
  });
  await asBob.mutation(api.lobbies.join, { lobbyId });

  // Create and start session with all lobby members
  const sessionId = await asAlice.mutation(api.sessions.createAndStartForLobby, {
    lobbyId,
    gameName: "Texas Hold'em",
    maxPlayers: 8,
  });

  // Initialize poker
  await asAlice.mutation(api.poker.mutations.initializePokerGame, {
    sessionId,
  });

  return { asAlice, asBob, lobbyId, sessionId };
}

describe("poker engine", () => {
  it("initializes a poker game with correct state", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, sessionId } = await setupPokerGame(t);

    const state = await asAlice.query(api.poker.queries.getPokerState, {
      sessionId,
    });

    expect(state).not.toBeNull();
    expect(state!.phase).toBe("preflop");
    expect(state!.players).toHaveLength(2);
    expect(state!.handNumber).toBe(1);
    expect(state!.communityCards).toHaveLength(0);

    // Blinds posted: SB=10, BB=20
    const chips = state!.players.map((p) => p.chips).sort();
    expect(chips).toEqual([980, 990]);

    // Alice sees her own cards
    const alicePlayer = state!.players.find(
      (p) => p.holeCards[0] !== "?" && p.holeCards[1] !== "?",
    );
    expect(alicePlayer).toBeDefined();
    expect(alicePlayer!.holeCards).toHaveLength(2);

    // Bob's cards hidden from Alice
    const bobState = await asBob.query(api.poker.queries.getPokerState, {
      sessionId,
    });
    const bobSeesOwn = bobState!.players.find(
      (p) => p.holeCards[0] !== "?" && p.holeCards[1] !== "?",
    );
    expect(bobSeesOwn).toBeDefined();
  });

  it("hides opponent cards during play", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, sessionId } = await setupPokerGame(t);

    const state = await asAlice.query(api.poker.queries.getPokerState, {
      sessionId,
    });

    const hiddenPlayers = state!.players.filter(
      (p) => p.holeCards[0] === "?" && p.holeCards[1] === "?",
    );
    expect(hiddenPlayers).toHaveLength(1);
  });

  it("does not expose deck to client", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, sessionId } = await setupPokerGame(t);

    const state = await asAlice.query(api.poker.queries.getPokerState, {
      sessionId,
    });

    expect(state).not.toHaveProperty("deck");
  });

  it("rejects action when not your turn", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, sessionId } = await setupPokerGame(t);

    const state = await asAlice.query(api.poker.queries.getPokerState, {
      sessionId,
    });

    // Find who goes second
    const secondPlayer = state!.currentPlayerIndex === 0 ? asBob : asAlice;

    await expect(
      secondPlayer.mutation(api.poker.mutations.playerAction, {
        sessionId,
        action: "check",
      }),
    ).rejects.toThrow();
  });

  it("plays a full hand to showdown via check-down", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await setupPokerGame(t);

    // Use test helper to play both seats
    // Preflop: seat 0 calls, seat 1 checks
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("preflop");
    });

    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "call",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 1,
      action: "check",
    });

    // Should be on flop now
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("flop");
      expect(state!.communityCards).toHaveLength(3);
    });

    // Flop: both check
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 1,
      action: "check",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "check",
    });

    // Should be on turn
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("turn");
      expect(state!.communityCards).toHaveLength(4);
    });

    // Turn: both check
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 1,
      action: "check",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "check",
    });

    // Should be on river
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("river");
      expect(state!.communityCards).toHaveLength(5);
    });

    // River: both check
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 1,
      action: "check",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "check",
    });

    // Should be handComplete with a winner
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("handComplete");
      expect(state!.winnersLastHand).toBeDefined();
      expect(state!.winnersLastHand!.length).toBeGreaterThan(0);

      // Chips should sum to 2000 (no money lost)
      const totalChips = state!.players.reduce((s, p) => s + p.chips, 0);
      expect(totalChips).toBe(2000);
    });
  });

  it("handles fold correctly", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await setupPokerGame(t);

    // Preflop: seat 0 calls, seat 1 raises, seat 0 folds
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "call",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 1,
      action: "raise",
      amount: 50,
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "fold",
    });

    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("handComplete");
      expect(state!.winnersLastHand![0].handName).toBe("Last Standing");

      // Seat 0 folded after calling (lost 20), seat 1 wins
      const seat0 = state!.players.find((p) => p.seatIndex === 0)!;
      const seat1 = state!.players.find((p) => p.seatIndex === 1)!;
      expect(seat0.folded).toBe(true);
      expect(seat0.chips).toBe(980); // lost 20 (call)
      expect(seat1.chips).toBe(1020); // won 20 from seat 0 call + got own 20+50 back
      expect(seat0.chips + seat1.chips).toBe(2000);
    });
  });

  it("handles raise and call correctly", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await setupPokerGame(t);

    // Preflop: seat 0 calls, seat 1 raises 40, seat 0 calls
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "call",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 1,
      action: "raise",
      amount: 40,
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId,
      seatIndex: 0,
      action: "call",
    });

    // Should advance to flop
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("flop");
      expect(state!.communityCards).toHaveLength(3);

      // Both should have equal chips (1000 - 60 = 940)
      const seat0 = state!.players.find((p) => p.seatIndex === 0)!;
      const seat1 = state!.players.find((p) => p.seatIndex === 1)!;
      expect(seat0.chips).toBe(940);
      expect(seat1.chips).toBe(940);
    });
  });

  it("getPokerSummary returns correct data", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, sessionId } = await setupPokerGame(t);

    const summary = await asAlice.query(api.poker.queries.getPokerSummary, {
      sessionId,
    });

    expect(summary).not.toBeNull();
    expect(summary!.phase).toBe("preflop");
    expect(summary!.playerCount).toBe(2);
    expect(summary!.handNumber).toBe(1);
    expect(summary!.myChips).toBeGreaterThan(0);
  });

  it("prevents check when there is a bet to call", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await setupPokerGame(t);

    // Seat 0 is first to act preflop with SB=10, BB=20
    // Trying to check should fail (need to call BB)
    await expect(
      t.mutation(internal.poker.testHelper.actAsSeat, {
        sessionId,
        seatIndex: 0,
        action: "check",
      }),
    ).rejects.toThrow("Cannot check");
  });

  it("chips are conserved across a full hand", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await setupPokerGame(t);

    // Play a hand with betting
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "call",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 1, action: "check",
    });
    // Flop: raise and call
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 1, action: "raise", amount: 50,
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "call",
    });
    // Turn: check-check
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 1, action: "check",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "check",
    });
    // River: check-check
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 1, action: "check",
    });
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "check",
    });

    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("handComplete");
      const totalChips = state!.players.reduce((s, p) => s + p.chips, 0);
      expect(totalChips).toBe(2000);
    });
  });

  it("action log records actions via playerAction", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, sessionId } = await setupPokerGame(t);

    // Use authenticated playerAction — Alice is seat 0 (first player found by userId)
    // Preflop: Alice (seat 0) folds
    await asAlice.mutation(api.poker.mutations.playerAction, {
      sessionId, action: "fold",
    });

    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.actionLog).toBeDefined();
      expect(state!.actionLog!.length).toBeGreaterThan(0);
      expect(state!.actionLog!.some((l: string) => l.includes("folded"))).toBe(true);
    });
  });

  it("all-in correctly handles side pots with chip conservation", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await setupPokerGame(t);

    // Seat 0 goes all-in preflop
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "raise", amount: 980,
    });
    // Seat 1 calls the all-in
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 1, action: "call",
    });

    // Should auto-advance to handComplete (both all-in)
    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.phase).toBe("handComplete");
      expect(state!.communityCards.length).toBe(5);
      const totalChips = state!.players.reduce((s, p) => s + p.chips, 0);
      expect(totalChips).toBe(2000);
    });
  });

  it("3-player game works correctly", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const asCharlie = await createUser(t, "Charlie");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "3P Lobby",
      maxPlayers: 8,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });
    await asCharlie.mutation(api.lobbies.join, { lobbyId });

    const sessionId = await asAlice.mutation(api.sessions.createAndStartForLobby, {
      lobbyId,
      gameName: "Texas Hold'em",
      maxPlayers: 8,
    });

    await asAlice.mutation(api.poker.mutations.initializePokerGame, { sessionId });

    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.players).toHaveLength(3);
      expect(state!.phase).toBe("preflop");

      // Verify blinds: SB=10, BB=20, total chips = 3000 - 30
      const totalChips = state!.players.reduce((s, p) => s + p.chips, 0);
      expect(totalChips).toBe(3000 - 30);
    });
  });

  it("ready system works correctly", async () => {
    const t = convexTest(schema, modules);
    const { asAlice, asBob, sessionId } = await setupPokerGame(t);

    // Play to handComplete
    await t.mutation(internal.poker.testHelper.actAsSeat, {
      sessionId, seatIndex: 0, action: "fold",
    });

    // Toggle ready for both players
    await asAlice.mutation(api.poker.mutations.toggleReady, { sessionId });
    await asBob.mutation(api.poker.mutations.toggleReady, { sessionId });

    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      const readyCount = state!.players.filter((p) => p.readyForNext).length;
      expect(readyCount).toBe(2);
      // Countdown should have started
      expect(state!.countdownStartedAt).toBeDefined();
    });

    // Un-ready cancels countdown
    await asAlice.mutation(api.poker.mutations.toggleReady, { sessionId });

    await t.run(async (ctx) => {
      const state = await ctx.db
        .query("pokerState")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
        .unique();
      expect(state!.countdownStartedAt).toBeUndefined();
    });
  });
});
