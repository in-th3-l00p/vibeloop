import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    fullName: v.string(),
    firstName: v.string(),
    imageUrl: v.string(),
    tag: v.string(),
    bio: v.string(),
    accent: v.string(),
    banner: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    vibeBalance: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tag", ["tag"])
    .index("by_username", ["username"])
    .index("by_walletAddress", ["walletAddress"])
    .searchIndex("search_username", { searchField: "username" })
    .searchIndex("search_tag", { searchField: "tag" }),

  userSettings: defineTable({
    userId: v.id("users"),
    profileCardTheme: v.string(),
    welcomeText: v.string(),
    titleColor: v.string(),
    uiTheme: v.number(),
    showWelcome: v.boolean(),
    showLobby: v.boolean(),
    showGames: v.boolean(),
    showMarketplace: v.boolean(),
    compactMode: v.boolean(),
    glowEffects: v.boolean(),
  }).index("by_userId", ["userId"]),

  gameStats: defineTable({
    userId: v.id("users"),
    gameName: v.string(),
    played: v.number(),
    wins: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_gameName", ["userId", "gameName"]),

  friendships: defineTable({
    user1: v.id("users"),
    user2: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked"),
    ),
    requestedBy: v.id("users"),
  })
    .index("by_user1", ["user1"])
    .index("by_user2", ["user2"])
    .index("by_user1_and_user2", ["user1", "user2"]),

  userPresence: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("online"),
      v.literal("in-game"),
      v.literal("offline"),
    ),
    lastSeen: v.number(),
  }).index("by_userId", ["userId"]),

  lobbies: defineTable({
    name: v.string(),
    hostId: v.id("users"),
    maxPlayers: v.number(),
    isOpen: v.boolean(),
  })
    .index("by_hostId", ["hostId"])
    .index("by_isOpen", ["isOpen"]),

  lobbyMembers: defineTable({
    lobbyId: v.id("lobbies"),
    userId: v.id("users"),
    role: v.union(v.literal("host"), v.literal("member")),
  })
    .index("by_lobbyId", ["lobbyId"])
    .index("by_userId", ["userId"]),

  gameSessions: defineTable({
    lobbyId: v.id("lobbies"),
    gameName: v.string(),
    createdBy: v.id("users"),
    maxPlayers: v.number(),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished"),
    ),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_lobbyId", ["lobbyId"])
    .index("by_lobbyId_and_status", ["lobbyId", "status"])
    .index("by_status", ["status"]),

  sessionMembers: defineTable({
    sessionId: v.id("gameSessions"),
    userId: v.id("users"),
    status: v.union(v.literal("ready"), v.literal("idle")),
    result: v.optional(
      v.union(v.literal("win"), v.literal("loss"), v.literal("draw")),
    ),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),

  chatMessages: defineTable({
    lobbyId: v.id("lobbies"),
    userId: v.id("users"),
    text: v.string(),
  }).index("by_lobbyId", ["lobbyId"]),

  nftInventory: defineTable({
    userId: v.id("users"),
    walletAddress: v.string(),
    contractAddress: v.string(),
    tokenId: v.string(),
    itemSlug: v.string(),
    acquiredAt: v.number(),
    txHash: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_walletAddress", ["walletAddress"])
    .index("by_contractAddress_and_tokenId", ["contractAddress", "tokenId"])
    .index("by_userId_and_itemSlug", ["userId", "itemSlug"]),

  chainSyncState: defineTable({
    contractAddress: v.string(),
    lastBlockSynced: v.number(),
    lastSyncedAt: v.number(),
  }).index("by_contractAddress", ["contractAddress"]),
});
