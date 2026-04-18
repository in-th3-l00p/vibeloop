import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getUserCardTheme } from "./lib/getUserCardTheme";

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
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (args.targetUserId === user._id) {
      throw new Error("Cannot invite yourself");
    }

    // Verify sender is in the lobby
    const senderMembership = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(200);
    if (!senderMembership.some((m) => m.userId === user._id)) {
      throw new Error("You are not in this lobby");
    }

    // Check target is not already in the lobby
    if (senderMembership.some((m) => m.userId === args.targetUserId)) {
      throw new Error("User is already in this lobby");
    }

    // Check for duplicate pending invite
    const existing = await ctx.db
      .query("lobbyInvitations")
      .withIndex("by_lobbyId_and_toUserId", (q) =>
        q.eq("lobbyId", args.lobbyId).eq("toUserId", args.targetUserId),
      )
      .take(10);
    if (existing.some((inv) => inv.status === "pending")) {
      throw new Error("Invitation already sent");
    }

    return await ctx.db.insert("lobbyInvitations", {
      lobbyId: args.lobbyId,
      fromUserId: user._id,
      toUserId: args.targetUserId,
      status: "pending",
    });
  },
});

export const accept = mutation({
  args: {
    invitationId: v.id("lobbyInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const invitation = await ctx.db.get(args.invitationId);

    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.toUserId !== user._id) {
      throw new Error("This invitation is not for you");
    }
    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer pending");
    }

    const lobby = await ctx.db.get(invitation.lobbyId);
    if (!lobby || !lobby.isOpen) {
      throw new Error("Lobby is no longer available");
    }

    // Leave current lobby (with host promotion logic)
    const myMemberships = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(1);

    if (myMemberships.length > 0) {
      const oldMembership = myMemberships[0];
      const oldLobbyId = oldMembership.lobbyId;
      await ctx.db.delete(oldMembership._id);

      if (oldMembership.role === "host") {
        const remaining = await ctx.db
          .query("lobbyMembers")
          .withIndex("by_lobbyId", (q) => q.eq("lobbyId", oldLobbyId))
          .take(200);
        if (remaining.length > 0) {
          await ctx.db.patch(remaining[0]._id, { role: "host" });
          await ctx.db.patch(oldLobbyId, { hostId: remaining[0].userId });
        } else {
          await ctx.db.patch(oldLobbyId, { isOpen: false });
        }
      }
    }

    // Join the invited lobby
    await ctx.db.insert("lobbyMembers", {
      lobbyId: invitation.lobbyId,
      userId: user._id,
      role: "member",
    });

    // Mark invitation as accepted
    await ctx.db.patch(args.invitationId, { status: "accepted" });
    return invitation.lobbyId;
  },
});

export const decline = mutation({
  args: {
    invitationId: v.id("lobbyInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const invitation = await ctx.db.get(args.invitationId);

    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.toUserId !== user._id) {
      throw new Error("This invitation is not for you");
    }

    await ctx.db.delete(args.invitationId);
  },
});

export const cancel = mutation({
  args: {
    invitationId: v.id("lobbyInvitations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const invitation = await ctx.db.get(args.invitationId);

    if (!invitation) {
      throw new Error("Invitation not found");
    }
    if (invitation.fromUserId !== user._id) {
      throw new Error("Can only cancel invitations you sent");
    }

    await ctx.db.delete(args.invitationId);
  },
});

export const listMyInvitations = query({
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

    const invitations = await ctx.db
      .query("lobbyInvitations")
      .withIndex("by_toUserId", (q) => q.eq("toUserId", user._id))
      .take(50);

    const pending = invitations.filter((inv) => inv.status === "pending");

    const results = [];
    for (const inv of pending) {
      const lobby = await ctx.db.get(inv.lobbyId);
      if (!lobby || !lobby.isOpen) continue;

      const sender = await ctx.db.get(inv.fromUserId);
      if (!sender) continue;

      const cardTheme = await getUserCardTheme(ctx, inv.fromUserId);

      results.push({
        invitation: inv,
        lobby: { _id: lobby._id, name: lobby.name },
        sender: { ...sender, cardTheme },
      });
    }

    return results;
  },
});
