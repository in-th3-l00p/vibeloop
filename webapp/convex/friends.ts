import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
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

function orderIds(
  a: Id<"users">,
  b: Id<"users">,
): [Id<"users">, Id<"users">] {
  return a < b ? [a, b] : [b, a];
}

export const sendRequest = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (args.targetUserId === user._id) {
      throw new Error("Cannot friend yourself");
    }

    const [user1, user2] = orderIds(user._id, args.targetUserId);

    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_user1_and_user2", (q) =>
        q.eq("user1", user1).eq("user2", user2),
      )
      .unique();

    if (existing) {
      throw new Error("Friendship already exists");
    }

    return await ctx.db.insert("friendships", {
      user1,
      user2,
      status: "pending",
      requestedBy: user._id,
    });
  },
});

export const acceptRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friendship not found");
    }
    if (friendship.status !== "pending") {
      throw new Error("Friendship is not pending");
    }
    if (friendship.requestedBy === user._id) {
      throw new Error("Cannot accept your own request");
    }

    // Verify the current user is part of this friendship
    if (friendship.user1 !== user._id && friendship.user2 !== user._id) {
      throw new Error("Not part of this friendship");
    }

    await ctx.db.patch(args.friendshipId, { status: "accepted" });
    return args.friendshipId;
  },
});

export const removeFriend = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friendship not found");
    }
    if (friendship.user1 !== user._id && friendship.user2 !== user._id) {
      throw new Error("Not part of this friendship");
    }

    await ctx.db.delete(args.friendshipId);
  },
});

export const getRelationship = query({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
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

    if (user._id === args.targetUserId) {
      return { kind: "self" as const };
    }

    const [u1, u2] = orderIds(user._id, args.targetUserId);
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user1_and_user2", (q) =>
        q.eq("user1", u1).eq("user2", u2),
      )
      .unique();

    if (!friendship) {
      return { kind: "none" as const };
    }

    if (friendship.status === "accepted") {
      return {
        kind: "friends" as const,
        friendshipId: friendship._id,
      };
    }

    if (friendship.status === "pending") {
      const iSent = friendship.requestedBy === user._id;
      return {
        kind: "pending" as const,
        friendshipId: friendship._id,
        direction: iSent ? ("outgoing" as const) : ("incoming" as const),
      };
    }

    if (friendship.status === "blocked") {
      return { kind: "blocked" as const, friendshipId: friendship._id };
    }

    return { kind: "none" as const };
  },
});

export const declineRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friendship not found");
    }
    if (friendship.user1 !== user._id && friendship.user2 !== user._id) {
      throw new Error("Not part of this friendship");
    }

    await ctx.db.delete(args.friendshipId);
  },
});

export const cancelRequest = mutation({
  args: {
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friendship not found");
    }
    if (friendship.requestedBy !== user._id) {
      throw new Error("Can only cancel requests you sent");
    }

    await ctx.db.delete(args.friendshipId);
  },
});

export const listPendingRequests = query({
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

    const asUser1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("user1", user._id))
      .take(200);
    const asUser2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("user2", user._id))
      .take(200);

    const allPending = [...asUser1, ...asUser2].filter(
      (f) => f.status === "pending",
    );

    const results = [];
    for (const f of allPending) {
      const iSent = f.requestedBy === user._id;
      const otherUserId = iSent
        ? (f.user1 === user._id ? f.user2 : f.user1)
        : f.requestedBy;
      const otherUser = await ctx.db.get(otherUserId);
      if (!otherUser) continue;
      const cardTheme = await getUserCardTheme(ctx, otherUserId);
      results.push({
        friendship: f,
        user: { ...otherUser, cardTheme },
        direction: iSent ? ("outgoing" as const) : ("incoming" as const),
      });
    }
    return results;
  },
});

export const listFriends = query({
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

    const asUser1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("user1", user._id))
      .take(200);

    const asUser2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("user2", user._id))
      .take(200);

    const allFriendships = [...asUser1, ...asUser2].filter(
      (f) => f.status === "accepted",
    );

    const results = [];
    for (const f of allFriendships) {
      const friendId = f.user1 === user._id ? f.user2 : f.user1;
      const friend = await ctx.db.get(friendId);
      if (!friend) continue;

      const presence = await ctx.db
        .query("userPresence")
        .withIndex("by_userId", (q) => q.eq("userId", friendId))
        .unique();

      const cardTheme = await getUserCardTheme(ctx, friendId);

      results.push({
        friendship: f,
        user: { ...friend, cardTheme },
        presence: presence ?? { status: "offline" as const, lastSeen: 0 },
      });
    }

    return results;
  },
});
