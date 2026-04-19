import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { emitToSessionMembers } from "./events";

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
    lobbyId: v.id("lobbies"),
    gameName: v.string(),
    maxPlayers: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Verify user is host of this lobby
    const membership = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(200);
    const myMembership = membership.find((m) => m.userId === user._id);

    if (!myMembership || myMembership.role !== "host") {
      throw new Error("Only the lobby host can create sessions");
    }

    return await ctx.db.insert("gameSessions", {
      lobbyId: args.lobbyId,
      gameName: args.gameName,
      createdBy: user._id,
      maxPlayers: args.maxPlayers,
      status: "waiting",
    });
  },
});

export const join = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "waiting") {
      throw new Error("Session is not accepting players");
    }

    // Verify user is a lobby member
    const lobbyMembership = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", session.lobbyId))
      .take(200);
    const isLobbyMember = lobbyMembership.some((m) => m.userId === user._id);
    if (!isLobbyMember) {
      throw new Error("Must be a lobby member to join a session");
    }

    // Check one-session-at-a-time rule
    const existingSessions = await ctx.db
      .query("sessionMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    for (const sm of existingSessions) {
      const existingSession = await ctx.db.get(sm.sessionId);
      if (
        existingSession &&
        (existingSession.status === "waiting" ||
          existingSession.status === "playing")
      ) {
        throw new Error("Already in an active session");
      }
    }

    // Check capacity
    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(session.maxPlayers + 1);
    if (members.length >= session.maxPlayers) {
      throw new Error("Session is full");
    }

    return await ctx.db.insert("sessionMembers", {
      sessionId: args.sessionId,
      userId: user._id,
      status: "idle",
    });
  },
});

export const leave = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(200);
    const myMembership = members.find((m) => m.userId === user._id);

    if (!myMembership) {
      throw new Error("Not in this session");
    }

    await ctx.db.delete(myMembership._id);
  },
});

export const setReady = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(200);
    const myMembership = members.find((m) => m.userId === user._id);

    if (!myMembership) {
      throw new Error("Not in this session");
    }

    const newStatus = myMembership.status === "ready" ? "idle" : "ready";
    await ctx.db.patch(myMembership._id, { status: newStatus });
    return newStatus;
  },
});

export const start = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "waiting") {
      throw new Error("Session is not in waiting state");
    }

    // Only host or session creator can start
    const lobby = await ctx.db.get(session.lobbyId);
    if (
      session.createdBy !== user._id &&
      lobby?.hostId !== user._id
    ) {
      throw new Error("Only the host or session creator can start the session");
    }

    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(session.maxPlayers);

    if (members.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    const allReady = members.every((m) => m.status === "ready");
    if (!allReady) {
      throw new Error("Not all players are ready");
    }

    await ctx.db.patch(args.sessionId, {
      status: "playing",
      startedAt: Date.now(),
    });
  },
});

export const finish = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    results: v.array(
      v.object({
        userId: v.id("users"),
        result: v.union(
          v.literal("win"),
          v.literal("loss"),
          v.literal("draw"),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }
    if (session.status !== "playing") {
      throw new Error("Session is not currently playing");
    }

    const lobby = await ctx.db.get(session.lobbyId);
    if (
      session.createdBy !== user._id &&
      lobby?.hostId !== user._id
    ) {
      throw new Error(
        "Only the host or session creator can finish the session",
      );
    }

    // Update session members with results and game stats
    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(session.maxPlayers);

    for (const member of members) {
      const resultEntry = args.results.find(
        (r) => r.userId === member.userId,
      );
      if (resultEntry) {
        await ctx.db.patch(member._id, { result: resultEntry.result });

        // Update game stats
        const existingStat = await ctx.db
          .query("gameStats")
          .withIndex("by_userId_and_gameName", (q) =>
            q.eq("userId", member.userId).eq("gameName", session.gameName),
          )
          .unique();

        if (existingStat) {
          await ctx.db.patch(existingStat._id, {
            played: existingStat.played + 1,
            wins:
              existingStat.wins + (resultEntry.result === "win" ? 1 : 0),
          });
        } else {
          await ctx.db.insert("gameStats", {
            userId: member.userId,
            gameName: session.gameName,
            played: 1,
            wins: resultEntry.result === "win" ? 1 : 0,
          });
        }
      }
    }

    await ctx.db.patch(args.sessionId, {
      status: "finished",
      finishedAt: Date.now(),
    });
  },
});

export const getSessionsForLobby = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(50);

    const enriched = [];
    for (const session of sessions) {
      const members = await ctx.db
        .query("sessionMembers")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .take(session.maxPlayers);

      const memberDetails = [];
      for (const m of members) {
        const memberUser = await ctx.db.get(m.userId);
        if (memberUser) {
          memberDetails.push({ membership: m, user: memberUser });
        }
      }

      enriched.push({ session, members: memberDetails });
    }

    return enriched;
  },
});

export const getMySession = query({
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

    // Search from newest to oldest to find the active session faster
    const memberships = await ctx.db
      .query("sessionMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    for (const m of memberships) {
      const session = await ctx.db.get(m.sessionId);
      if (
        session &&
        (session.status === "waiting" || session.status === "playing")
      ) {
        return { session, membership: m };
      }
    }

    return null;
  },
});

export const createAndStartForLobby = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    gameName: v.string(),
    maxPlayers: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Verify user is host of this lobby
    const lobbyMembers = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", args.lobbyId))
      .take(200);
    const myMembership = lobbyMembers.find((m) => m.userId === user._id);

    if (!myMembership || myMembership.role !== "host") {
      throw new Error("Only the lobby host can start a game");
    }

    if (lobbyMembers.length < 2) {
      throw new Error("Need at least 2 players in the lobby");
    }

    // Create session
    const sessionId = await ctx.db.insert("gameSessions", {
      lobbyId: args.lobbyId,
      gameName: args.gameName,
      createdBy: user._id,
      maxPlayers: args.maxPlayers,
      status: "waiting",
    });

    // Enroll all lobby members as ready
    for (const member of lobbyMembers) {
      await ctx.db.insert("sessionMembers", {
        sessionId,
        userId: member.userId,
        status: "ready",
      });
    }

    // Start session
    await ctx.db.patch(sessionId, {
      status: "playing",
      startedAt: Date.now(),
    });

    // Emit gameStarted event to all session members
    await emitToSessionMembers(ctx, sessionId, "gameStarted", {
      sessionId,
      gameName: args.gameName,
    });

    return sessionId;
  },
});
