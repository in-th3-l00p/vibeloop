import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";

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

async function getAuthenticatedUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    const username =
      identity.preferredUsername ?? identity.name ?? "anonymous";
    const tag = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      username,
      fullName: identity.name ?? username,
      firstName: identity.givenName ?? identity.name ?? username,
      imageUrl: identity.pictureUrl ?? "",
      tag,
      bio: "",
      accent: "#a855f7",
      vibeBalance: 0,
    });

    await ctx.db.insert("userSettings", {
      userId,
      ...DEFAULT_SETTINGS,
    });

    return userId;
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    accent: v.optional(v.string()),
    banner: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (args.tag !== undefined) {
      const normalizedTag = args.tag.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (normalizedTag.length === 0) {
        throw new Error("Tag cannot be empty");
      }
      const existing = await ctx.db
        .query("users")
        .withIndex("by_tag", (q) => q.eq("tag", normalizedTag))
        .unique();
      if (existing && existing._id !== user._id) {
        throw new Error("Tag already taken");
      }
      args.tag = normalizedTag;
    }

    const updates: Record<string, string | undefined> = {};
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.accent !== undefined) updates.accent = args.accent;
    if (args.banner !== undefined) updates.banner = args.banner;
    if (args.tag !== undefined) updates.tag = args.tag;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.query.trim();
    if (trimmed.length === 0) {
      return [];
    }

    // Search by username
    const byUsername = await ctx.db
      .query("users")
      .withSearchIndex("search_username", (q) => q.search("username", trimmed))
      .take(10);

    // Search by tag
    const byTag = await ctx.db
      .query("users")
      .withSearchIndex("search_tag", (q) => q.search("tag", trimmed))
      .take(10);

    // Deduplicate by _id
    const seen = new Set<string>();
    const results = [];
    for (const user of [...byUsername, ...byTag]) {
      if (!seen.has(user._id)) {
        seen.add(user._id);
        results.push(user);
      }
    }

    return results.slice(0, 10);
  },
});

export const linkWallet = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      walletAddress: args.walletAddress,
    });

    return user._id;
  },
});
