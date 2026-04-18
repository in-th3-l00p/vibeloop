import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";
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

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

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
    const bettingDone =
      canAct === 0 || (canAct >= 1 && isBettingRoundComplete(players, playerIdx, args.action));

    if (bettingDone) {
      // Advance phase
      await advancePhase(ctx, state._id, state, players, lastAction);
    } else {
      await ctx.db.patch(state._id, {
        players,
        currentPlayerIndex: nextIdx === -1 ? state.currentPlayerIndex : nextIdx,
        lastAction,
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

function isBettingRoundComplete(
  players: PlayerState[],
  actorIndex: number,
  action: string,
): boolean {
  const activePlayers = players.filter(
    (p) => !p.folded && !p.allIn && !p.eliminated,
  );

  if (activePlayers.length === 0) return true;
  if (activePlayers.length === 1) {
    const highestBet = getHighestBet(players);
    return activePlayers[0].currentBet >= highestBet;
  }

  // All active players must have equal bets
  const highestBet = getHighestBet(players);
  const allEqual = activePlayers.every((p) => p.currentBet === highestBet);

  if (!allEqual) return false;

  // If the action was a raise, round is NOT complete (others need to respond)
  if (action === "raise") return false;

  return true;
}

function calculateTotalPot(players: PlayerState[]): number {
  return players.reduce((sum, p) => sum + p.totalBetThisRound, 0);
}

async function advancePhase(
  ctx: { db: any },
  stateId: any,
  state: any,
  players: PlayerState[],
  lastAction: any,
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

    await ctx.db.patch(stateId, {
      phase: "handComplete",
      players,
      communityCards,
      deck,
      pots: [{ amount: 0, eligible: [] }],
      currentPlayerIndex: -1,
      lastAction,
      winnersLastHand,
    });
  } else {
    // Find first active player after dealer
    const firstToAct = getNextActivePlayerIndex(players, state.dealerIndex);

    const pots = calculatePots(players);

    await ctx.db.patch(stateId, {
      phase: nextPhase,
      players,
      communityCards,
      deck,
      pots,
      currentPlayerIndex: firstToAct,
      lastAction,
      lastRaiseAmount: state.bigBlind,
      minRaise: state.bigBlind,
    });
  }
}

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

    // Verify caller is in the game
    if (!state.players.some((p) => p.userId === user._id)) {
      throw new Error("You are not in this game");
    }

    const players = state.players.map((p) => ({ ...p }));

    // Eliminate busted players
    for (const p of players) {
      if (p.chips <= 0 && !p.eliminated) {
        p.eliminated = true;
      }
    }

    const remaining = players.filter((p) => !p.eliminated);

    if (remaining.length < 2) {
      // Game over — finish the session
      const winner = remaining[0];
      const results = players.map((p) => ({
        userId: p.userId as any,
        result: (p.userId === winner.userId ? "win" : "loss") as
          | "win"
          | "loss"
          | "draw",
      }));

      await ctx.runMutation(api.sessions.finish, {
        sessionId: args.sessionId,
        results,
      });

      // Clean up poker state
      await ctx.db.delete(state._id);
      return { gameOver: true, winnerId: winner.userId };
    }

    // Rotate dealer
    let newDealerIndex = (state.dealerIndex + 1) % players.length;
    while (players[newDealerIndex].eliminated) {
      newDealerIndex = (newDealerIndex + 1) % players.length;
    }

    // Find SB and BB positions
    let sbIndex = newDealerIndex;
    let bbIndex: number;

    if (remaining.length === 2) {
      // Heads-up: dealer is SB
      sbIndex = newDealerIndex;
      bbIndex = getNextActivePlayerIndex(players, newDealerIndex);
    } else {
      sbIndex = getNextActivePlayerIndex(players, newDealerIndex);
      bbIndex = getNextActivePlayerIndex(players, sbIndex);
    }

    // Reset player states
    let deck = shuffleDeck(createDeck());
    for (const p of players) {
      p.holeCards = [];
      p.currentBet = 0;
      p.totalBetThisRound = 0;
      p.folded = p.eliminated;
      p.allIn = false;
    }

    // Deal hole cards
    for (const p of players) {
      if (p.eliminated) continue;
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

    await ctx.db.patch(state._id, {
      phase: "preflop",
      players,
      communityCards: [],
      deck,
      pots: [
        {
          amount: sbAmount + bbAmount,
          eligible: players.filter((p) => !p.eliminated).map((p) => p.userId),
        },
      ],
      currentPlayerIndex: firstToAct,
      dealerIndex: newDealerIndex,
      lastRaiseAmount: bb,
      minRaise: bb,
      handNumber: state.handNumber + 1,
      lastAction: undefined,
      winnersLastHand: undefined,
    });

    return { gameOver: false };
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

    player.folded = true;
    player.eliminated = true;

    // If it was their turn, advance
    let currentPlayerIndex = state.currentPlayerIndex;
    if (currentPlayerIndex === playerIdx) {
      currentPlayerIndex = getNextActivePlayerIndex(players, playerIdx);
    }

    const remaining = players.filter((p) => !p.eliminated);

    if (remaining.length < 2) {
      // Game over
      const winner = remaining[0];
      // Give them all chips from the leaver
      winner.chips += player.chips;
      player.chips = 0;

      const results = players.map((p) => ({
        userId: p.userId as any,
        result: (p.userId === winner.userId ? "win" : "loss") as
          | "win"
          | "loss"
          | "draw",
      }));

      await ctx.runMutation(api.sessions.finish, {
        sessionId: args.sessionId,
        results,
      });

      await ctx.db.delete(state._id);
      return;
    }

    await ctx.db.patch(state._id, {
      players,
      currentPlayerIndex: currentPlayerIndex === -1 ? 0 : currentPlayerIndex,
    });
  },
});
