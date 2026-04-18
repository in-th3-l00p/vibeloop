import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

const DEFAULT_SETTINGS = {
  profileCardTheme: "default",
  welcomeText: "Welcome, {{first_name}}",
  titleColor: "#ffffff",
  uiTheme: 0,
  showWelcome: true,
  showLobby: true,
  showGames: true,
  showMarketplace: true,
  compactMode: false,
  glowEffects: true,
};

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

export const getForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const get = query({
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
    return await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const update = mutation({
  args: {
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!settings) {
      throw new Error("Settings not found");
    }

    const validKeys = Object.keys(DEFAULT_SETTINGS);
    if (!validKeys.includes(args.key)) {
      throw new Error(`Invalid setting key: ${args.key}`);
    }

    await ctx.db.patch(settings._id, { [args.key]: args.value });
    return settings._id;
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!settings) {
      throw new Error("Settings not found");
    }

    await ctx.db.patch(settings._id, DEFAULT_SETTINGS);
    return settings._id;
  },
});
