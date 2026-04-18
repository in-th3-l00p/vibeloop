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

export const create = mutation({
  args: {
    name: v.string(),
    maxPlayers: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const lobbyId = await ctx.db.insert("lobbies", {
      name: args.name,
      hostId: user._id,
      maxPlayers: args.maxPlayers,
      isOpen: true,
    });

    await ctx.db.insert("lobbyMembers", {
      lobbyId,
      userId: user._id,
      role: "host",
    });

    return lobbyId;
  },
});

export const join = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const lobby = await ctx.db.get(args.lobbyId);

    if (!lobby) {
      throw new Error("Lobby not found");
    }
    if (!lobby.isOpen) {
      throw new Error("Lobby is closed");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(10);
    const alreadyIn = existing.find((m) => m.lobbyId === args.lobbyId);
    if (alreadyIn) {
      throw new Error("Already in this lobby");
    }

    // Check capacity
    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(lobby.maxPlayers + 1);
    if (members.length >= lobby.maxPlayers) {
      throw new Error("Lobby is full");
    }

    return await ctx.db.insert("lobbyMembers", {
      lobbyId: args.lobbyId,
      userId: user._id,
      role: "member",
    });
  },
});

export const leave = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const membership = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(200);
    const myMembership = membership.find((m) => m.userId === user._id);

    if (!myMembership) {
      throw new Error("Not in this lobby");
    }

    await ctx.db.delete(myMembership._id);

    // If host leaves, close the lobby
    if (myMembership.role === "host") {
      await ctx.db.patch(args.lobbyId, { isOpen: false });

      // Remove all remaining members
      const remaining = await ctx.db
        .query("lobbyMembers")
        .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
        .take(200);
      for (const member of remaining) {
        await ctx.db.delete(member._id);
      }
    }
  },
});

export const getMyLobby = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return null;
    }

    // Find which lobby the user is in
    const myMemberships = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(1);

    if (myMemberships.length === 0) {
      return null;
    }

    const membership = myMemberships[0];
    const lobby = await ctx.db.get(membership.lobbyId);
    if (!lobby) {
      return null;
    }

    // Get all members with user info
    const memberDocs = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobby._id))
      .take(lobby.maxPlayers);
    const members = [];
    for (const m of memberDocs) {
      const memberUser = await ctx.db.get(m.userId);
      if (memberUser) {
        members.push({ membership: m, user: memberUser });
      }
    }

    // Get sessions
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobby._id))
      .take(50);

    // Get recent chat
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobby._id))
      .order("desc")
      .take(50);

    // Enrich messages with user info
    const enrichedMessages = [];
    for (const msg of messages.reverse()) {
      const msgUser = await ctx.db.get(msg.userId);
      enrichedMessages.push({
        ...msg,
        username: msgUser?.username ?? "unknown",
        accent: msgUser?.accent ?? "#a855f7",
      });
    }

    return { lobby, members, sessions, messages: enrichedMessages };
  },
});

export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("lobbies")
      .withIndex("by_isOpen", (q) => q.eq("isOpen", true))
      .take(50);
  },
});
