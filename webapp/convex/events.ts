import { v } from "convex/values";
import { query, mutation, internalMutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const emit = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userEvents", {
      userId: args.userId,
      type: args.type,
      payload: args.payload,
    });
  },
});

export const dismiss = mutation({
  args: {
    eventId: v.id("userEvents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User not found");

    const event = await ctx.db.get(args.eventId);
    if (!event) return; // already dismissed
    if (event.userId !== user._id) throw new Error("Not your event");

    await ctx.db.delete(args.eventId);
  },
});

export const getMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("userEvents")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);
  },
});

/** Emit an event to all members of a game session */
export async function emitToSessionMembers(
  ctx: MutationCtx,
  sessionId: Id<"gameSessions">,
  type: string,
  payload: Record<string, unknown>,
) {
  const members = await ctx.db
    .query("sessionMembers")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .take(20);

  for (const m of members) {
    await ctx.db.insert("userEvents", {
      userId: m.userId,
      type,
      payload,
    });
  }
}
