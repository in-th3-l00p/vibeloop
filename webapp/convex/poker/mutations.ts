import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { getCurrentUser, loadPokerState } from "./helpers";
import {
  createDeck,
  shuffleDeck,
  dealCards,
  getNextActivePlayerIndex,
  countActivePlayers,
  countPlayersCanAct,
  getHighestBet,
  calculatePots,
  determineWinners,
  type PlayerState,
} from "./engine";

import { MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { emitToSessionMembers } from "../events";

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const TURN_TIMEOUT_MS = 30_000; // 30 seconds per decision

async function dealNextHand(
  ctx: { db: MutationCtx["db"]; runMutation: MutationCtx["runMutation"]; scheduler: MutationCtx["scheduler"] },
  state: Doc<"pokerState">,
  sessionId: Id<"gameSessions">,
) {
  const players = state.players.map((p) => ({ ...p }));

  // Eliminate busted players
  for (const p of players) {
    if (p.chips <= 0 && !p.eliminated) {
      p.eliminated = true;
    }
  }

  // Sit out players who are not ready (and not already sitting out/eliminated)
  for (const p of players) {
    if (!p.eliminated && !p.sittingOut && !p.readyForNext) {
      p.sittingOut = true;
    }
  }

  const remaining = players.filter((p) => !p.eliminated && !p.sittingOut);

  if (remaining.length < 2) {
    const winner = remaining[0];
    if (!winner) {
      await ctx.db.delete(state._id);
      return { gameOver: true };
    }
    const results = players.map((p) => ({
      userId: p.userId as Id<"users">,
      result: (p.userId === winner.userId ? "win" : "loss") as
        | "win"
        | "loss"
        | "draw",
    }));

    await ctx.runMutation(api.sessions.finish, {
      sessionId,
      results,
    });

    await ctx.db.delete(state._id);
    return { gameOver: true, winnerId: winner.userId };
  }

  // Reset player states first so active-player helpers work correctly
  let deck = shuffleDeck(createDeck());
  for (const p of players) {
    p.holeCards = [];
    p.currentBet = 0;
    p.totalBetThisRound = 0;
    p.folded = p.eliminated || !!p.sittingOut;
    p.allIn = false;
    p.readyForNext = false;
  }

  // Rotate dealer (skip eliminated and sitting-out)
  let newDealerIndex = (state.dealerIndex + 1) % players.length;
  let safety = 0;
  while (players[newDealerIndex].folded && safety < players.length) {
    newDealerIndex = (newDealerIndex + 1) % players.length;
    safety++;
  }

  // Find SB and BB positions
  let sbIndex: number;
  let bbIndex: number;

  if (remaining.length === 2) {
    sbIndex = newDealerIndex;
    bbIndex = getNextActivePlayerIndex(players, newDealerIndex);
  } else {
    sbIndex = getNextActivePlayerIndex(players, newDealerIndex);
    bbIndex = getNextActivePlayerIndex(players, sbIndex);
  }

  // Deal hole cards
  for (const p of players) {
    if (p.eliminated || p.sittingOut) continue;
    const { dealt, remaining: rem } = dealCards(deck, 2);
    p.holeCards = dealt;
    deck = rem;
  }

  // Post blinds
  const sb = state.smallBlind;
  const bb = state.bigBlind;

  const sbPlayer = players[sbIndex];
  const sbAmount = Math.min(sb, sbPlayer.chips);
  sbPlayer.chips -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  sbPlayer.totalBetThisRound = sbAmount;
  if (sbPlayer.chips === 0) sbPlayer.allIn = true;

  const bbPlayer = players[bbIndex];
  const bbAmount = Math.min(bb, bbPlayer.chips);
  bbPlayer.chips -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  bbPlayer.totalBetThisRound = bbAmount;
  if (bbPlayer.chips === 0) bbPlayer.allIn = true;

  const firstToAct = getNextActivePlayerIndex(players, bbIndex);
  const deadline = await scheduleTurnTimer(ctx, sessionId);

  await ctx.db.patch(state._id, {
    phase: "preflop",
    players,
    communityCards: [],
    deck,
    pots: [
      {
        amount: sbAmount + bbAmount,
        eligible: players
          .filter((p) => !p.eliminated && !p.sittingOut)
          .map((p) => p.userId),
      },
    ],
    currentPlayerIndex: firstToAct,
    dealerIndex: newDealerIndex,
    lastRaiseAmount: bb,
    minRaise: bb,
    roundStartPlayerIndex: firstToAct,
    handNumber: state.handNumber + 1,
    countdownStartedAt: undefined,
    turnDeadline: deadline,
    actionLog: [],
    lastAction: undefined,
    winnersLastHand: undefined,
  });

  return { gameOver: false };
}

export const initializePokerGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "playing")
      throw new Error("Session must be in playing state");

    // Check no poker state exists yet
    const existing = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (existing) throw new Error("Poker game already initialized");

    // Get session members
    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(10);

    if (members.length < 2)
      throw new Error("Need at least 2 players to start poker");

    // Verify caller is a member
    if (!members.some((m) => m.userId === user._id))
      throw new Error("You are not in this session");

    // Shuffle deck and deal
    let deck = shuffleDeck(createDeck());

    const players = members.map((m, i) => {
      const { dealt, remaining } = dealCards(deck, 2);
      deck = remaining;
      return {
        userId: m.userId,
        chips: STARTING_CHIPS - (i === 1 ? SMALL_BLIND : i === 2 % members.length ? BIG_BLIND : 0),
        holeCards: dealt,
        currentBet: 0,
        totalBetThisRound: 0,
        folded: false,
        allIn: false,
        eliminated: false,
        seatIndex: i,
      };
    });

    // Post blinds
    const dealerIndex = 0;
    const sbIndex = members.length === 2 ? 0 : 1;
    const bbIndex = members.length === 2 ? 1 : 2;

    players[sbIndex].chips -= SMALL_BLIND;
    players[sbIndex].currentBet = SMALL_BLIND;
    players[sbIndex].totalBetThisRound = SMALL_BLIND;

    players[bbIndex].chips -= BIG_BLIND;
    players[bbIndex].currentBet = BIG_BLIND;
    players[bbIndex].totalBetThisRound = BIG_BLIND;

    // Fix chip double-deduction: reset chips first since we deducted above
    for (const p of players) {
      p.chips = STARTING_CHIPS;
    }
    players[sbIndex].chips = STARTING_CHIPS - SMALL_BLIND;
    players[bbIndex].chips = STARTING_CHIPS - BIG_BLIND;

    // First to act is after BB
    const firstToAct = (bbIndex + 1) % players.length;
    const deadline = await scheduleTurnTimer(ctx, args.sessionId);

    await ctx.db.insert("pokerState", {
      sessionId: args.sessionId,
      phase: "preflop",
      players,
      communityCards: [],
      deck,
      pots: [
        {
          amount: SMALL_BLIND + BIG_BLIND,
          eligible: players.map((p) => p.userId),
        },
      ],
      currentPlayerIndex: firstToAct,
      dealerIndex,
      smallBlind: SMALL_BLIND,
      bigBlind: BIG_BLIND,
      lastRaiseAmount: BIG_BLIND,
      minRaise: BIG_BLIND,
      roundStartPlayerIndex: firstToAct,
      turnDeadline: deadline,
      handNumber: 1,
    });
  },
});

export const playerAction = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    action: v.union(
      v.literal("fold"),
      v.literal("check"),
      v.literal("call"),
      v.literal("raise"),
    ),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const state = await loadPokerState(ctx, args.sessionId);

    if (state.phase === "showdown" || state.phase === "handComplete") {
      throw new Error("Hand is over — wait for next hand");
    }

    const playerIdx = state.players.findIndex(
      (p) => p.userId === user._id,
    );
    if (playerIdx === -1) throw new Error("You are not in this game");

    const player = state.players[playerIdx];
    if (player.folded || player.allIn || player.eliminated) {
      throw new Error("You cannot act right now");
    }
    if (state.currentPlayerIndex !== playerIdx) {
      throw new Error("Not your turn");
    }

    const players = state.players.map((p) => ({ ...p }));
    const currentPlayer = players[playerIdx];
    const highestBet = getHighestBet(players);

    switch (args.action) {
      case "fold": {
        currentPlayer.folded = true;
        break;
      }
      case "check": {
        if (currentPlayer.currentBet < highestBet) {
          throw new Error("Cannot check — there is a bet to call");
        }
        break;
      }
      case "call": {
        const callAmount = highestBet - currentPlayer.currentBet;
        if (callAmount <= 0) throw new Error("Nothing to call");

        if (callAmount >= currentPlayer.chips) {
          // All-in call
          const actualCall = currentPlayer.chips;
          currentPlayer.totalBetThisRound += actualCall;
          currentPlayer.currentBet += actualCall;
          currentPlayer.chips = 0;
          currentPlayer.allIn = true;
        } else {
          currentPlayer.chips -= callAmount;
          currentPlayer.currentBet = highestBet;
          currentPlayer.totalBetThisRound += callAmount;
        }
        break;
      }
      case "raise": {
        const raiseAmount = args.amount;
        if (raiseAmount === undefined)
          throw new Error("Raise amount required");

        const toCall = highestBet - currentPlayer.currentBet;
        const totalNeeded = toCall + raiseAmount;

        if (raiseAmount < state.minRaise && totalNeeded < currentPlayer.chips) {
          throw new Error(
            `Minimum raise is ${state.minRaise}`,
          );
        }

        if (totalNeeded >= currentPlayer.chips) {
          // All-in
          const actualTotal = currentPlayer.chips;
          currentPlayer.totalBetThisRound += actualTotal;
          currentPlayer.currentBet += actualTotal;
          currentPlayer.chips = 0;
          currentPlayer.allIn = true;
        } else {
          currentPlayer.chips -= totalNeeded;
          currentPlayer.currentBet = highestBet + raiseAmount;
          currentPlayer.totalBetThisRound += totalNeeded;
        }
        break;
      }
    }

    // Record last action
    const lastAction = {
      userId: user._id,
      action: args.action,
      amount: args.action === "raise" ? args.amount : undefined,
    };

    // Build action log entry
    const logEntry =
      args.action === "raise"
        ? `${user.username} raised ${args.amount}`
        : args.action === "call"
          ? `${user.username} called ${highestBet - (state.players[playerIdx].currentBet)}`
          : `${user.username} ${args.action}ed`;
    const actionLog = [...(state.actionLog ?? []), logEntry];

    // Check if hand is over (only 1 non-folded player)
    if (countActivePlayers(players) === 1) {
      // Award pot to last player standing
      const winner = players.find((p) => !p.folded && !p.eliminated)!;
      const totalPot = calculateTotalPot(players);
      winner.chips += totalPot;

      // Reset bets
      for (const p of players) {
        p.currentBet = 0;
        p.totalBetThisRound = 0;
      }

      await ctx.db.patch(state._id, {
        phase: "handComplete",
        players,
        pots: [{ amount: 0, eligible: [] }],
        lastAction,
        actionLog,
        winnersLastHand: [
          {
            userId: winner.userId,
            amount: totalPot,
            handName: "Last Standing",
          },
        ],
      });
      return;
    }

    // Advance to next player or next phase
    const nextIdx = getNextActivePlayerIndex(players, playerIdx);
    const canAct = countPlayersCanAct(players);

    // Check if betting round is complete
    // A raise always resets the round — others must respond
    let newRoundStart = state.roundStartPlayerIndex ?? state.currentPlayerIndex;
    if (args.action === "raise") {
      newRoundStart = playerIdx;
    }

    // Round is complete when:
    // 1. No one can act, OR
    // 2. All bets are equal AND the next player is the round starter (full orbit)
    const highBet = getHighestBet(players);
    const allEqual = players
      .filter((p) => !p.folded && !p.allIn && !p.eliminated)
      .every((p) => p.currentBet === highBet);
    const bettingDone =
      canAct === 0 ||
      (allEqual && args.action !== "raise" && nextIdx === newRoundStart);

    if (bettingDone) {
      await advancePhase(ctx, state._id, state, players, lastAction, actionLog);
    } else {
      const deadline = await scheduleTurnTimer(ctx, args.sessionId);
      await ctx.db.patch(state._id, {
        players,
        currentPlayerIndex: nextIdx === -1 ? state.currentPlayerIndex : nextIdx,
        lastAction,
        actionLog,
        turnDeadline: deadline,
        roundStartPlayerIndex: newRoundStart,
        lastRaiseAmount:
          args.action === "raise" ? (args.amount ?? state.lastRaiseAmount) : state.lastRaiseAmount,
        minRaise:
          args.action === "raise"
            ? (args.amount ?? state.minRaise)
            : state.minRaise,
      });
    }
  },
});

function calculateTotalPot(players: PlayerState[]): number {
  return players.reduce((sum, p) => sum + p.totalBetThisRound, 0);
}

async function advancePhase(
  ctx: { db: any; scheduler: MutationCtx["scheduler"] },
  stateId: any,
  state: any,
  players: PlayerState[],
  lastAction: any,
  actionLog?: string[],
) {
  let { deck, communityCards, phase } = state;
  deck = [...deck];
  communityCards = [...communityCards];

  // Reset current bets for next round
  for (const p of players) {
    p.currentBet = 0;
  }

  let nextPhase: string;

  switch (phase) {
    case "preflop": {
      // Deal flop (3 cards)
      const { dealt, remaining } = dealCards(deck, 3);
      communityCards = dealt;
      deck = remaining;
      nextPhase = "flop";
      break;
    }
    case "flop": {
      const { dealt, remaining } = dealCards(deck, 1);
      communityCards = [...communityCards, ...dealt];
      deck = remaining;
      nextPhase = "turn";
      break;
    }
    case "turn": {
      const { dealt, remaining } = dealCards(deck, 1);
      communityCards = [...communityCards, ...dealt];
      deck = remaining;
      nextPhase = "river";
      break;
    }
    case "river": {
      nextPhase = "showdown";
      break;
    }
    default:
      nextPhase = "showdown";
  }

  if (nextPhase === "showdown" || countPlayersCanAct(players) <= 1) {
    // Deal remaining community cards if needed
    while (communityCards.length < 5) {
      const { dealt, remaining } = dealCards(deck, 1);
      communityCards = [...communityCards, ...dealt];
      deck = remaining;
    }

    // Evaluate winners
    const pots = calculatePots(players);
    const winnerResults = determineWinners(players, communityCards, pots);

    // Award chips
    for (const w of winnerResults) {
      const p = players.find((pl) => pl.userId === w.userId);
      if (p) p.chips += w.amount;
    }

    // Reset bets
    for (const p of players) {
      p.totalBetThisRound = 0;
      p.currentBet = 0;
    }

    const winnersLastHand = winnerResults.map((w) => ({
      userId: w.userId as any,
      amount: w.amount,
      handName: w.handName,
    }));

    const cardNames = communityCards.join(" ");
    const showdownLog = [...(actionLog ?? []), `Showdown: ${cardNames}`];

    await ctx.db.patch(stateId, {
      phase: "handComplete",
      players,
      communityCards,
      deck,
      pots: [{ amount: 0, eligible: [] }],
      currentPlayerIndex: -1,
      lastAction,
      actionLog: showdownLog,
      turnDeadline: undefined,
      winnersLastHand,
    });
  } else {
    // Find first active player after dealer
    const firstToAct = getNextActivePlayerIndex(players, state.dealerIndex);

    const pots = calculatePots(players);
    const deadline = await scheduleTurnTimer(ctx, state.sessionId);

    const phaseLabel: Record<string, string> = { flop: "Flop", turn: "Turn", river: "River" };
    const phaseLog = [...(actionLog ?? []), `--- ${phaseLabel[nextPhase] ?? nextPhase} ---`];

    await ctx.db.patch(stateId, {
      phase: nextPhase,
      players,
      communityCards,
      deck,
      pots,
      actionLog: phaseLog,
      currentPlayerIndex: firstToAct,
      lastAction,
      lastRaiseAmount: state.bigBlind,
      minRaise: state.bigBlind,
      roundStartPlayerIndex: firstToAct,
      turnDeadline: deadline,
    });
  }
}

/** Schedule a turn timer. Returns the deadline timestamp. */
async function scheduleTurnTimer(
  ctx: { scheduler: MutationCtx["scheduler"] },
  sessionId: Id<"gameSessions">,
): Promise<number> {
  const deadline = Date.now() + TURN_TIMEOUT_MS;
  await ctx.scheduler.runAfter(
    TURN_TIMEOUT_MS,
    internal.poker.mutations.autoFold,
    { sessionId, turnDeadline: deadline },
  );
  return deadline;
}

export const autoFold = internalMutation({
  args: {
    sessionId: v.id("gameSessions"),
    turnDeadline: v.number(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!state) return;

    // Only auto-fold if the deadline matches (player hasn't acted yet)
    if (state.turnDeadline !== args.turnDeadline) return;
    if (state.phase === "handComplete" || state.phase === "showdown") return;
    if (state.currentPlayerIndex < 0) return;

    const players = state.players.map((p) => ({ ...p }));
    const playerIdx = state.currentPlayerIndex;
    const player = players[playerIdx];
    if (!player || player.folded || player.allIn || player.eliminated) return;

    // Auto-fold
    player.folded = true;

    const lastAction = {
      userId: player.userId,
      action: "fold",
    };

    // Check if only 1 non-folded player remains
    if (countActivePlayers(players) === 1) {
      const winner = players.find((p) => !p.folded && !p.eliminated)!;
      const totalPot = players.reduce((s, p) => s + p.totalBetThisRound, 0);
      winner.chips += totalPot;
      for (const p of players) {
        p.currentBet = 0;
        p.totalBetThisRound = 0;
      }
      await ctx.db.patch(state._id, {
        phase: "handComplete",
        players,
        pots: [{ amount: 0, eligible: [] }],
        currentPlayerIndex: -1,
        lastAction,
        turnDeadline: undefined,
        winnersLastHand: [
          { userId: winner.userId, amount: totalPot, handName: "Last Standing" },
        ],
      });
      return;
    }

    // Advance to next player
    const nextIdx = getNextActivePlayerIndex(players, playerIdx);
    const highBet = getHighestBet(players);
    const allEqual = players
      .filter((p) => !p.folded && !p.allIn && !p.eliminated)
      .every((p) => p.currentBet === highBet);
    const newRoundStart = state.roundStartPlayerIndex ?? state.currentPlayerIndex;
    const bettingDone =
      countPlayersCanAct(players) === 0 ||
      (allEqual && nextIdx === newRoundStart);

    if (bettingDone) {
      await advancePhase(ctx, state._id, state, players, lastAction);
    } else {
      const deadline = await scheduleTurnTimer(ctx, args.sessionId);
      await ctx.db.patch(state._id, {
        players,
        currentPlayerIndex: nextIdx === -1 ? state.currentPlayerIndex : nextIdx,
        lastAction,
        turnDeadline: deadline,
      });
    }
  },
});

const COUNTDOWN_SECONDS = 5;

export const toggleReady = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const state = await loadPokerState(ctx, args.sessionId);

    if (state.phase !== "handComplete") {
      throw new Error("Can only ready up between hands");
    }

    const playerIdx = state.players.findIndex(
      (p) => p.userId === user._id,
    );
    if (playerIdx === -1) throw new Error("You are not in this game");

    const player = state.players[playerIdx];
    if (player.eliminated) throw new Error("You have been eliminated");

    const players = state.players.map((p) => ({ ...p }));
    players[playerIdx].readyForNext = !players[playerIdx].readyForNext;
    // Readying up also clears sitting out
    if (players[playerIdx].readyForNext && players[playerIdx].sittingOut) {
      players[playerIdx].sittingOut = false;
    }

    // Check if all eligible players are now ready
    const eligible = players.filter((p) => !p.eliminated);
    const readyCount = eligible.filter((p) => p.readyForNext).length;
    const allReady = readyCount >= 2 && readyCount === eligible.length;

    if (allReady && !state.countdownStartedAt) {
      // Start countdown — schedule auto-start
      const now = Date.now();
      await ctx.scheduler.runAfter(
        COUNTDOWN_SECONDS * 1000,
        internal.poker.mutations.autoStartNextHand,
        { sessionId: args.sessionId, countdownStartedAt: now },
      );
      await ctx.db.patch(state._id, { players, countdownStartedAt: now });
    } else if (!allReady && state.countdownStartedAt) {
      // Someone un-readied — cancel countdown
      await ctx.db.patch(state._id, { players, countdownStartedAt: undefined });
    } else {
      await ctx.db.patch(state._id, { players });
    }
  },
});

export const autoStartNextHand = internalMutation({
  args: {
    sessionId: v.id("gameSessions"),
    countdownStartedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    // Bail if state is gone, hand already started, or countdown was cancelled
    if (!state) return;
    if (state.phase !== "handComplete") return;
    if (state.countdownStartedAt !== args.countdownStartedAt) return;

    // All eligible players should be ready (re-validate)
    const eligible = state.players.filter((p) => !p.eliminated);
    const readyCount = eligible.filter((p) => p.readyForNext).length;
    if (readyCount < 2) return;

    await dealNextHand(ctx, state, args.sessionId);
  },
});

export const startNextHand = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const state = await loadPokerState(ctx, args.sessionId);

    if (state.phase !== "handComplete") {
      throw new Error("Current hand is not complete");
    }

    // Only the session creator (host) can start the next hand
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    const lobby = await ctx.db.get(session.lobbyId);
    if (session.createdBy !== user._id && lobby?.hostId !== user._id) {
      throw new Error("Only the host can start the next hand");
    }

    return await dealNextHand(ctx, state, args.sessionId);
  },
});

export const leavePokerGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const state = await loadPokerState(ctx, args.sessionId);

    const playerIdx = state.players.findIndex(
      (p) => p.userId === user._id,
    );
    if (playerIdx === -1) throw new Error("You are not in this game");

    const players = state.players.map((p) => ({ ...p }));
    const player = players[playerIdx];

    if (player.eliminated) throw new Error("Already eliminated");

    // Auto-fold the current hand if still active
    if (!player.folded) {
      player.folded = true;
    }
    // Mark as sitting out — they keep their chips but skip future hands
    player.sittingOut = true;

    // If it was their turn, advance
    let currentPlayerIndex = state.currentPlayerIndex;
    if (currentPlayerIndex === playerIdx) {
      currentPlayerIndex = getNextActivePlayerIndex(players, playerIdx);
    }

    // Check if only 1 non-folded player remains in the current hand
    const activeInHand = players.filter((p) => !p.folded && !p.eliminated);
    if (
      activeInHand.length === 1 &&
      state.phase !== "handComplete"
    ) {
      // Award pot to last player standing
      const winner = activeInHand[0];
      const totalPot = players.reduce((s, p) => s + p.totalBetThisRound, 0);
      winner.chips += totalPot;
      for (const p of players) {
        p.currentBet = 0;
        p.totalBetThisRound = 0;
      }

      await ctx.db.patch(state._id, {
        phase: "handComplete",
        players,
        pots: [{ amount: 0, eligible: [] }],
        currentPlayerIndex: -1,
        winnersLastHand: [
          { userId: winner.userId, amount: totalPot, handName: "Last Standing" },
        ],
      });
      return;
    }

    // Check if all remaining non-sitting-out players < 2 → game over
    const activePlayers = players.filter(
      (p) => !p.eliminated && !p.sittingOut,
    );
    if (activePlayers.length < 2) {
      // Only 1 active player left, but sitting-out players still have chips
      // Don't end the game — they can rejoin. Just update state.
      await ctx.db.patch(state._id, {
        players,
        currentPlayerIndex: currentPlayerIndex === -1 ? 0 : currentPlayerIndex,
      });
      return;
    }

    await ctx.db.patch(state._id, {
      players,
      currentPlayerIndex: currentPlayerIndex === -1 ? 0 : currentPlayerIndex,
    });
  },
});

export const rejoinPokerGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const state = await loadPokerState(ctx, args.sessionId);

    const playerIdx = state.players.findIndex(
      (p) => p.userId === user._id,
    );
    if (playerIdx === -1) throw new Error("You are not in this game");

    const players = state.players.map((p) => ({ ...p }));
    const player = players[playerIdx];

    if (player.eliminated) throw new Error("You have been eliminated");
    if (!player.sittingOut) throw new Error("You are already in the game");
    if (player.chips <= 0) throw new Error("No chips remaining");

    // Mark as back in — they'll be dealt in on the next hand
    player.sittingOut = false;

    await ctx.db.patch(state._id, { players });
  },
});

export const closePokerGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Only host can close
    const lobby = await ctx.db.get(session.lobbyId);
    if (session.createdBy !== user._id && lobby?.hostId !== user._id) {
      throw new Error("Only the host can close the game");
    }

    if (session.status !== "playing") {
      throw new Error("Session is not active");
    }

    // Check no hand is in progress
    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (state && state.phase !== "handComplete") {
      throw new Error("Cannot close while a hand is in progress");
    }

    // Determine winner (most chips)
    const results = session.gameName === "Texas Hold'em" && state
      ? (() => {
          const sorted = [...state.players].sort((a, b) => b.chips - a.chips);
          const topChips = sorted[0]?.chips ?? 0;
          return state.players.map((p) => ({
            userId: p.userId,
            result: (p.chips === topChips ? "win" : "loss") as "win" | "loss" | "draw",
          }));
        })()
      : [];

    // Clean up poker state
    if (state) {
      await ctx.db.delete(state._id);
    }

    // Finish the session
    await ctx.db.patch(args.sessionId, {
      status: "finished" as const,
      finishedAt: Date.now(),
    });

    // Update session member results
    if (results.length > 0) {
      const members = await ctx.db
        .query("sessionMembers")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
        .take(20);
      for (const m of members) {
        const r = results.find((r) => r.userId === m.userId);
        if (r) {
          await ctx.db.patch(m._id, { result: r.result });
        }
      }
    }

    // Emit gameEnded event to all session members
    await emitToSessionMembers(ctx, args.sessionId, "gameEnded", {
      sessionId: args.sessionId,
      gameName: session.gameName,
    });
  },
});
