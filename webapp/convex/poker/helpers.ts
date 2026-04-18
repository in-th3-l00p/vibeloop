import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getCurrentUser(ctx: QueryCtx) {
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

export async function loadPokerState(
  ctx: QueryCtx,
  sessionId: Id<"gameSessions">,
) {
  const state = await ctx.db
    .query("pokerState")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .unique();
  if (!state) {
    throw new Error("Poker state not found for this session");
  }
  return state;
}
