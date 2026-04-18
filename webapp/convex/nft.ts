import { v } from "convex/values";
import { query, internalMutation, QueryCtx } from "./_generated/server";

export const getMyInventory = query({
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
    return await ctx.db
      .query("nftInventory")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(200);
  },
});

export const ownsItem = query({
  args: {
    itemSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return false;
    }
    const item = await ctx.db
      .query("nftInventory")
      .withIndex("by_userId_and_itemSlug", (q) =>
        q.eq("userId", user._id).eq("itemSlug", args.itemSlug),
      )
      .take(1);
    return item.length > 0;
  },
});

export const syncTransferEvent = internalMutation({
  args: {
    contractAddress: v.string(),
    tokenId: v.string(),
    fromAddress: v.string(),
    toAddress: v.string(),
    itemSlug: v.string(),
    blockTimestamp: v.number(),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Find existing record for this token
    const existing = await ctx.db
      .query("nftInventory")
      .withIndex("by_contractAddress_and_tokenId", (q) =>
        q
          .eq("contractAddress", args.contractAddress)
          .eq("tokenId", args.tokenId),
      )
      .unique();

    // Remove old ownership if exists
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // If transferred to zero address (burn), don't create new record
    if (
      args.toAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return;
    }

    // Find the user by wallet address
    const user = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) =>
        q.eq("walletAddress", args.toAddress),
      )
      .unique();

    // Only track if the recipient is a registered user
    if (!user) {
      return;
    }

    await ctx.db.insert("nftInventory", {
      userId: user._id,
      walletAddress: args.toAddress,
      contractAddress: args.contractAddress,
      tokenId: args.tokenId,
      itemSlug: args.itemSlug,
      acquiredAt: args.blockTimestamp,
      txHash: args.txHash,
    });
  },
});

export const syncVibeBalance = internalMutation({
  args: {
    walletAddress: v.string(),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) =>
        q.eq("walletAddress", args.walletAddress),
      )
      .unique();

    if (!user) {
      return;
    }

    await ctx.db.patch(user._id, { vibeBalance: args.balance });
  },
});
