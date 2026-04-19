// TEST ONLY — allows acting as a specific seat index without auth checks
// Remove before production

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import {
  createDeck,
  shuffleDeck,
  getNextActivePlayerIndex,
  countActivePlayers,
  countPlayersCanAct,
  getHighestBet,
  calculatePots,
  determineWinners,
  dealCards,
  type PlayerState,
} from "./engine";

export const setupTestGame = internalMutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const lobbyMembers = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(10);

    if (lobbyMembers.length < 2) throw new Error("Need 2+ lobby members");

    // Create session
    const sessionId = await ctx.db.insert("gameSessions", {
      lobbyId: args.lobbyId,
      gameName: "Texas Hold'em",
      createdBy: lobbyMembers[0].userId,
      maxPlayers: 8,
      status: "playing",
      startedAt: Date.now(),
    });

    // Add all members to session
    for (const m of lobbyMembers) {
      await ctx.db.insert("sessionMembers", {
        sessionId,
        userId: m.userId,
        status: "ready",
      });
    }

    // Initialize poker state
    let deck = shuffleDeck(createDeck());
    const SB = 10;
    const BB = 20;

    const players = lobbyMembers.map((m, i) => {
      const { dealt, remaining } = dealCards(deck, 2);
      deck = remaining;
      return {
        userId: m.userId,
        chips: 1000,
        holeCards: dealt,
        currentBet: 0,
        totalBetThisRound: 0,
        folded: false,
        allIn: false,
        eliminated: false,
        seatIndex: i,
      };
    });

    // Post blinds (heads-up: seat 0 = dealer/SB, seat 1 = BB)
    players[0].chips -= SB;
    players[0].currentBet = SB;
    players[0].totalBetThisRound = SB;
    players[1].chips -= BB;
    players[1].currentBet = BB;
    players[1].totalBetThisRound = BB;

    const firstToAct = 0; // In heads-up, dealer/SB acts first preflop

    await ctx.db.insert("pokerState", {
      sessionId,
      phase: "preflop",
      players,
      communityCards: [],
      deck,
      pots: [{
        amount: SB + BB,
        eligible: players.map((p) => p.userId),
      }],
      currentPlayerIndex: firstToAct,
      dealerIndex: 0,
      smallBlind: SB,
      bigBlind: BB,
      lastRaiseAmount: BB,
      minRaise: BB,
      roundStartPlayerIndex: firstToAct,
      handNumber: 1,
    });

    return {
      sessionId,
      seat0Cards: players[0].holeCards,
      seat1Cards: players[1].holeCards,
    };
  },
});

export const getFullState = internalMutation({
  args: { sessionId: v.id("gameSessions") },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!state) return null;
    return {
      phase: state.phase,
      communityCards: state.communityCards,
      currentPlayerIndex: state.currentPlayerIndex,
      handNumber: state.handNumber,
      players: state.players.map((p) => ({
        seat: p.seatIndex,
        chips: p.chips,
        cards: p.holeCards,
        bet: p.currentBet,
        totalBet: p.totalBetThisRound,
        folded: p.folded,
        allIn: p.allIn,
      })),
      pots: state.pots,
      winnersLastHand: state.winnersLastHand,
    };
  },
});

export const actAsSeat = internalMutation({
  args: {
    sessionId: v.id("gameSessions"),
    seatIndex: v.number(),
    action: v.union(
      v.literal("fold"),
      v.literal("check"),
      v.literal("call"),
      v.literal("raise"),
    ),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!state) throw new Error("No poker state");

    if (state.phase === "showdown" || state.phase === "handComplete") {
      throw new Error("Hand is over");
    }

    const playerIdx = state.players.findIndex(
      (p) => p.seatIndex === args.seatIndex,
    );
    if (playerIdx === -1) throw new Error("Seat not found");

    if (state.currentPlayerIndex !== playerIdx) {
      throw new Error(
        `Not seat ${args.seatIndex}'s turn. Current: seat ${state.players[state.currentPlayerIndex]?.seatIndex}`,
      );
    }

    const players = state.players.map((p) => ({ ...p }));
    const currentPlayer = players[playerIdx];

    if (currentPlayer.folded || currentPlayer.allIn || currentPlayer.eliminated) {
      throw new Error("Player cannot act");
    }

    const highestBet = getHighestBet(players);

    switch (args.action) {
      case "fold":
        currentPlayer.folded = true;
        break;
      case "check":
        if (currentPlayer.currentBet < highestBet)
          throw new Error("Cannot check");
        break;
      case "call": {
        const callAmt = highestBet - currentPlayer.currentBet;
        if (callAmt <= 0) throw new Error("Nothing to call");
        if (callAmt >= currentPlayer.chips) {
          currentPlayer.totalBetThisRound += currentPlayer.chips;
          currentPlayer.currentBet += currentPlayer.chips;
          currentPlayer.chips = 0;
          currentPlayer.allIn = true;
        } else {
          currentPlayer.chips -= callAmt;
          currentPlayer.currentBet = highestBet;
          currentPlayer.totalBetThisRound += callAmt;
        }
        break;
      }
      case "raise": {
        const raiseAmt = args.amount ?? state.minRaise;
        const toCall = highestBet - currentPlayer.currentBet;
        const totalNeeded = toCall + raiseAmt;
        if (totalNeeded >= currentPlayer.chips) {
          currentPlayer.totalBetThisRound += currentPlayer.chips;
          currentPlayer.currentBet += currentPlayer.chips;
          currentPlayer.chips = 0;
          currentPlayer.allIn = true;
        } else {
          currentPlayer.chips -= totalNeeded;
          currentPlayer.currentBet = highestBet + raiseAmt;
          currentPlayer.totalBetThisRound += totalNeeded;
        }
        break;
      }
    }

    const lastAction = {
      userId: currentPlayer.userId,
      action: args.action,
      amount: args.action === "raise" ? args.amount : undefined,
    };

    // Only 1 player left?
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
        lastAction,
        winnersLastHand: [
          { userId: winner.userId, amount: totalPot, handName: "Last Standing" },
        ],
      });
      return { result: "handComplete", winner: winner.seatIndex };
    }

    // Check if betting round done
    const nextIdx = getNextActivePlayerIndex(players, playerIdx);
    const canAct = countPlayersCanAct(players);
    const activeBetters = players.filter(
      (p) => !p.folded && !p.allIn && !p.eliminated,
    );
    let roundStart = state.roundStartPlayerIndex ?? state.currentPlayerIndex;
    if (args.action === "raise") {
      roundStart = playerIdx;
    }
    const allEqual =
      activeBetters.length === 0 ||
      activeBetters.every((p) => p.currentBet === getHighestBet(players));
    const bettingDone =
      canAct === 0 || (allEqual && args.action !== "raise" && nextIdx === roundStart);

    if (bettingDone) {
      // Advance phase
      let { deck, communityCards, phase } = state;
      deck = [...deck];
      communityCards = [...communityCards];
      for (const p of players) p.currentBet = 0;

      let nextPhase: string;
      switch (phase) {
        case "preflop": {
          const r = dealCards(deck, 3);
          communityCards = r.dealt;
          deck = r.remaining;
          nextPhase = "flop";
          break;
        }
        case "flop": {
          const r = dealCards(deck, 1);
          communityCards = [...communityCards, ...r.dealt];
          deck = r.remaining;
          nextPhase = "turn";
          break;
        }
        case "turn": {
          const r = dealCards(deck, 1);
          communityCards = [...communityCards, ...r.dealt];
          deck = r.remaining;
          nextPhase = "river";
          break;
        }
        default:
          nextPhase = "showdown";
      }

      if (nextPhase === "showdown" || countPlayersCanAct(players) <= 1) {
        while (communityCards.length < 5) {
          const r = dealCards(deck, 1);
          communityCards = [...communityCards, ...r.dealt];
          deck = r.remaining;
        }
        const pots = calculatePots(players);
        const winnerResults = determineWinners(players, communityCards, pots);
        for (const w of winnerResults) {
          const p = players.find((pl) => pl.userId === w.userId);
          if (p) p.chips += w.amount;
        }
        for (const p of players) {
          p.totalBetThisRound = 0;
          p.currentBet = 0;
        }
        await ctx.db.patch(state._id, {
          phase: "handComplete",
          players,
          communityCards,
          deck,
          pots: [{ amount: 0, eligible: [] }],
          currentPlayerIndex: -1,
          lastAction,
          winnersLastHand: winnerResults.map((w) => ({
            userId: w.userId as any,
            amount: w.amount,
            handName: w.handName,
          })),
        });
        return { result: "handComplete" };
      }

      const firstToAct = getNextActivePlayerIndex(players, state.dealerIndex);
      const pots = calculatePots(players).map((p) => ({
        ...p,
        eligible: p.eligible as unknown as Id<"users">[],
      }));
      await ctx.db.patch(state._id, {
        phase: nextPhase as any,
        players,
        communityCards,
        deck,
        pots,
        currentPlayerIndex: firstToAct,
        lastAction,
        lastRaiseAmount: state.bigBlind,
        minRaise: state.bigBlind,
        roundStartPlayerIndex: firstToAct,
      });
      return { result: nextPhase };
    }

    // Just advance turn
    await ctx.db.patch(state._id, {
      players,
      currentPlayerIndex: nextIdx === -1 ? state.currentPlayerIndex : nextIdx,
      lastAction,
      roundStartPlayerIndex: roundStart,
      lastRaiseAmount:
        args.action === "raise"
          ? (args.amount ?? state.lastRaiseAmount)
          : state.lastRaiseAmount,
      minRaise:
        args.action === "raise" ? (args.amount ?? state.minRaise) : state.minRaise,
    });
    return { result: "next_turn", nextSeat: players[nextIdx]?.seatIndex };
  },
});
