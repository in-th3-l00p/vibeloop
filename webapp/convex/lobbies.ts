import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getUserCardTheme } from "./lib/getUserCardTheme";
import { Id } from "./_generated/dataModel";

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

/** Shared helper: create a solo lobby for a user */
async function createSoloLobby(ctx: MutationCtx, userId: Id<"users">, username: string) {
  const lobbyId = await ctx.db.insert("lobbies", {
    name: `${username}'s Lobby`,
    hostId: userId,
    maxPlayers: 20,
    isOpen: true,
  });
  await ctx.db.insert("lobbyMembers", {
    lobbyId,
    userId,
    role: "host",
  });
  return lobbyId;
}

/** Shared helper: remove user from their current lobby, handle host transfer */
async function leaveCurrentLobby(ctx: MutationCtx, userId: Id<"users">) {
  const memberships = await ctx.db
    .query("lobbyMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(1);

  if (memberships.length === 0) return null;

  const membership = memberships[0];
  const lobbyId = membership.lobbyId;

  await ctx.db.delete(membership._id);

  if (membership.role === "host") {
    // Find remaining members sorted by creation time (earliest joined)
    const remaining = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobbyId))
      .take(200);

    if (remaining.length > 0) {
      // Promote earliest member to host
      const newHost = remaining[0];
      await ctx.db.patch(newHost._id, { role: "host" });
      await ctx.db.patch(lobbyId, { hostId: newHost.userId });
    } else {
      // No one left — close lobby
      await ctx.db.patch(lobbyId, { isOpen: false });
    }
  }

  return lobbyId;
}

export const getOrCreateMyLobby = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    // Check if already in a lobby
    const existing = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(1);

    if (existing.length > 0) {
      return existing[0].lobbyId;
    }

    // Create solo lobby
    return await createSoloLobby(ctx, user._id, user.username);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    maxPlayers: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Leave current lobby first
    await leaveCurrentLobby(ctx, user._id);

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

    // Check if already in THIS lobby
    const myMemberships = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(10);
    const alreadyIn = myMemberships.find((m) => m.lobbyId === args.lobbyId);
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

    // Leave current lobby first
    await leaveCurrentLobby(ctx, user._id);

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

    if (myMembership.role === "host") {
      const remaining = await ctx.db
        .query("lobbyMembers")
        .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
        .take(200);

      if (remaining.length > 0) {
        const newHost = remaining[0];
        await ctx.db.patch(newHost._id, { role: "host" });
        await ctx.db.patch(args.lobbyId, { hostId: newHost.userId });
      } else {
        await ctx.db.patch(args.lobbyId, { isOpen: false });
      }
    }

    // Auto-create a new solo lobby for the user who left
    await createSoloLobby(ctx, user._id, user.username);
  },
});

export const kick = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const lobby = await ctx.db.get(args.lobbyId);

    if (!lobby) {
      throw new Error("Lobby not found");
    }
    if (lobby.hostId !== user._id) {
      throw new Error("Only the host can kick members");
    }
    if (args.targetUserId === user._id) {
      throw new Error("Cannot kick yourself");
    }

    const members = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(200);
    const targetMembership = members.find((m) => m.userId === args.targetUserId);

    if (!targetMembership) {
      throw new Error("User is not in this lobby");
    }

    await ctx.db.delete(targetMembership._id);

    // Create solo lobby for kicked user
    const targetUser = await ctx.db.get(args.targetUserId);
    await createSoloLobby(ctx, args.targetUserId, targetUser?.username ?? "player");
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

    const memberDocs = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobby._id))
      .take(lobby.maxPlayers);
    const members = [];
    for (const m of memberDocs) {
      const memberUser = await ctx.db.get(m.userId);
      if (memberUser) {
        const cardTheme = await getUserCardTheme(ctx, m.userId);
        members.push({ membership: m, user: { ...memberUser, cardTheme } });
      }
    }

    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobby._id))
      .take(50);

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", lobby._id))
      .order("desc")
      .take(50);

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
