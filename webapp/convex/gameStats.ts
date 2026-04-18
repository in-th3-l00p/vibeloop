import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return [];
    }
    return await ctx.db
      .query("gameStats")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);
  },
});

export const recordGame = mutation({
  args: {
    gameName: v.string(),
    won: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const existing = await ctx.db
      .query("gameStats")
      .withIndex("by_userId_and_gameName", (q) =>
        q.eq("userId", user._id).eq("gameName", args.gameName),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        played: existing.played + 1,
        wins: existing.wins + (args.won ? 1 : 0),
      });
      return existing._id;
    }

    return await ctx.db.insert("gameStats", {
      userId: user._id,
      gameName: args.gameName,
      played: 1,
      wins: args.won ? 1 : 0,
    });
  },
});
