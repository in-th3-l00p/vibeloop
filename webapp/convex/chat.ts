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

export const send = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (args.text.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    // Verify user is a lobby member
    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(200);
    const isMember = members.some((m) => m.userId === user._id);
    if (!isMember) {
      throw new Error("Must be a lobby member to send messages");
    }

    return await ctx.db.insert("chatMessages", {
      lobbyId: args.lobbyId,
      userId: user._id,
      text: args.text.trim(),
    });
  },
});

export const list = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .order("desc")
      .take(50);

    const enriched = [];
    for (const msg of messages.reverse()) {
      const user = await ctx.db.get(msg.userId);
      enriched.push({
        ...msg,
        username: user?.username ?? "unknown",
        accent: user?.accent ?? "#a855f7",
      });
    }

    return enriched;
  },
});
