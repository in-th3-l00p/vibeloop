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

  games: defineTable({
    name: v.string(),
    desc: v.string(),
    players: v.string(),
    tag: v.string(),
    accent: v.string(),
    gradient: v.string(),
    emoji: v.string(),
  })
    .index("by_name", ["name"])
    .index("by_tag", ["tag"])
    .searchIndex("search_name", { searchField: "name" }),

  marketplaceItems: defineTable({
    slug: v.string(),
    name: v.string(),
    type: v.string(),
    price: v.string(),
    accent: v.string(),
    gradient: v.string(),
    rarity: v.string(),
    desc: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_type", ["type"])
    .index("by_rarity", ["rarity"])
    .searchIndex("search_name", { searchField: "name" }),

  lobbyInvitations: defineTable({
    lobbyId: v.id("lobbies"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
    ),
  })
    .index("by_toUserId", ["toUserId"])
    .index("by_fromUserId", ["fromUserId"])
    .index("by_lobbyId_and_toUserId", ["lobbyId", "toUserId"]),

  chainSyncState: defineTable({
    contractAddress: v.string(),
    lastBlockSynced: v.number(),
    lastSyncedAt: v.number(),
  }).index("by_contractAddress", ["contractAddress"]),

  userEvents: defineTable({
    userId: v.id("users"),
    type: v.string(),
    payload: v.any(),
  }).index("by_userId", ["userId"]),

  pokerState: defineTable({
    sessionId: v.id("gameSessions"),
    phase: v.union(
      v.literal("preflop"),
      v.literal("flop"),
      v.literal("turn"),
      v.literal("river"),
      v.literal("showdown"),
      v.literal("handComplete"),
    ),
    players: v.array(
      v.object({
        userId: v.id("users"),
        chips: v.number(),
        holeCards: v.array(v.string()),
        currentBet: v.number(),
        totalBetThisRound: v.number(),
        folded: v.boolean(),
        allIn: v.boolean(),
        eliminated: v.boolean(),
        sittingOut: v.optional(v.boolean()),
        readyForNext: v.optional(v.boolean()),
        seatIndex: v.number(),
      }),
    ),
    communityCards: v.array(v.string()),
    deck: v.array(v.string()),
    pots: v.array(
      v.object({
        amount: v.number(),
        eligible: v.array(v.id("users")),
      }),
    ),
    currentPlayerIndex: v.number(),
    dealerIndex: v.number(),
    smallBlind: v.number(),
    bigBlind: v.number(),
    lastRaiseAmount: v.number(),
    minRaise: v.number(),
    roundStartPlayerIndex: v.optional(v.number()),
    handNumber: v.number(),
    countdownStartedAt: v.optional(v.number()),
    turnDeadline: v.optional(v.number()),
    lastAction: v.optional(
      v.object({
        userId: v.id("users"),
        action: v.string(),
        amount: v.optional(v.number()),
      }),
    ),
    winnersLastHand: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          amount: v.number(),
          handName: v.string(),
        }),
      ),
    ),
  }).index("by_sessionId", ["sessionId"]),
});
