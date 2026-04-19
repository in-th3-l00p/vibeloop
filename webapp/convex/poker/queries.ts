import { v } from "convex/values";
import { query } from "../_generated/server";
import { getUserCardTheme } from "../lib/getUserCardTheme";

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

    // Enrich players with profile data + filter card visibility
    const players = [];
    for (const p of state.players) {
      const playerUser = await ctx.db.get(p.userId);
      const cardTheme = await getUserCardTheme(ctx, p.userId);
      players.push({
        ...p,
        holeCards:
          p.userId === user._id || isShowdown
            ? p.holeCards
            : p.holeCards.map(() => "?"),
        username: playerUser?.username ?? "Unknown",
        tag: playerUser?.tag ?? "",
        imageUrl: playerUser?.imageUrl ?? "",
        accent: playerUser?.accent ?? "#a855f7",
        cardTheme,
      });
    }

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
      turnDeadline: state.turnDeadline,
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
