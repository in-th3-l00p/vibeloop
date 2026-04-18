import { v } from "convex/values";
import { mutation, internalMutation, QueryCtx } from "./_generated/server";

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

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

export const heartbeat = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("in-game"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        lastSeen: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userPresence", {
      userId: user._id,
      status: args.status,
      lastSeen: now,
    });
  },
});

export const markOffline = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threshold = now - STALE_THRESHOLD_MS;

    // Process in batches to stay within transaction limits
    const stalePresences = await ctx.db
      .query("userPresence")
      .take(500);

    for (const presence of stalePresences) {
      if (presence.lastSeen < threshold && presence.status !== "offline") {
        await ctx.db.patch(presence._id, { status: "offline" });
      }
    }
  },
});
