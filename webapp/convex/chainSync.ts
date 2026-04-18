import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const getSyncState = internalQuery({
  args: {
    contractAddress: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chainSyncState")
      .withIndex("by_contractAddress", (q) =>
        q.eq("contractAddress", args.contractAddress),
      )
      .unique();
  },
});

export const updateSyncState = internalMutation({
  args: {
    contractAddress: v.string(),
    lastBlockSynced: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chainSyncState")
      .withIndex("by_contractAddress", (q) =>
        q.eq("contractAddress", args.contractAddress),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastBlockSynced: args.lastBlockSynced,
        lastSyncedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("chainSyncState", {
        contractAddress: args.contractAddress,
        lastBlockSynced: args.lastBlockSynced,
        lastSyncedAt: Date.now(),
      });
    }
  },
});

// Placeholder action — will need Alchemy/Infura API key and contract ABI
export const pollTransfers = action({
  args: {},
  handler: async (ctx) => {
    // TODO: Implement when contract addresses and Alchemy API key are configured
    // 1. Get last synced block from chainSyncState
    // 2. Fetch Transfer events from lastBlockSynced to latest
    // 3. For each event, call internal.nft.syncTransferEvent
    // 4. Update chainSyncState with latest block
    return null;
  },
});

// Placeholder action — will need Alchemy/Infura API key and ERC-20 contract address
export const pollVibeBalances = action({
  args: {},
  handler: async (ctx) => {
    // TODO: Implement when $VIBE contract address and Alchemy API key are configured
    // 1. Get all users with linked wallets
    // 2. Batch call balanceOf on ERC-20 contract
    // 3. Call internal.nft.syncVibeBalance for each
    return null;
  },
});
