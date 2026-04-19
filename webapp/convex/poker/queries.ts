import { v } from "convex/values";
import { query } from "../_generated/server";

export const getPokerState = query({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;

    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!state) return null;

    const isShowdown =
      state.phase === "showdown" || state.phase === "handComplete";

    // Filter card visibility
    const players = state.players.map((p) => ({
      ...p,
      holeCards:
        p.userId === user._id || isShowdown
          ? p.holeCards
          : p.holeCards.map(() => "?"),
    }));

    return {
      sessionId: state.sessionId,
      phase: state.phase,
      players,
      communityCards: state.communityCards,
      pots: state.pots,
      currentPlayerIndex: state.currentPlayerIndex,
      dealerIndex: state.dealerIndex,
      smallBlind: state.smallBlind,
      bigBlind: state.bigBlind,
      lastRaiseAmount: state.lastRaiseAmount,
      minRaise: state.minRaise,
      handNumber: state.handNumber,
      countdownStartedAt: state.countdownStartedAt,
      lastAction: state.lastAction,
      winnersLastHand: state.winnersLastHand,
      // deck is NEVER returned
    };
  },
});

export const getPokerSummary = query({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;

    const state = await ctx.db
      .query("pokerState")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!state) return null;

    const myPlayer = state.players.find((p) => p.userId === user._id);

    return {
      sessionId: state.sessionId,
      phase: state.phase,
      playerCount: state.players.filter((p) => !p.eliminated).length,
      myChips: myPlayer?.chips ?? 0,
      isSittingOut: myPlayer?.sittingOut ?? false,
      isEliminated: myPlayer?.eliminated ?? false,
      isMyTurn:
        myPlayer !== undefined &&
        state.currentPlayerIndex === myPlayer.seatIndex &&
        !myPlayer.folded &&
        !myPlayer.eliminated,
      handNumber: state.handNumber,
    };
  },
});
