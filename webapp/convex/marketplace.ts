import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("marketplaceItems").take(100);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketplaceItems")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("marketplaceItems").take(1);
    if (existing.length > 0) return;

    const items = [
      { slug: "neon-pulse", name: "Neon Pulse", type: "Card Theme", price: "120", accent: "#a855f7", gradient: "linear-gradient(135deg, #7c3aed, #c026d3, #e879f9)", rarity: "rare", desc: "A vibrant purple-to-pink gradient that pulses with neon energy. Makes your profile card glow in the dark." },
      { slug: "og-founder", name: "OG Founder", type: "Badge", price: "500", accent: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)", rarity: "legendary", desc: "Exclusive badge for early adopters. Shows everyone you were here from the beginning." },
      { slug: "glacier", name: "Glacier", type: "Card Theme", price: "80", accent: "#38bdf8", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4, #67e8f9)", rarity: "uncommon", desc: "Cool blue tones inspired by arctic ice. Clean, crisp, and refreshing." },
      { slug: "hot-streak", name: "Hot Streak", type: "Badge", price: "200", accent: "#f97316", gradient: "linear-gradient(135deg, #ef4444, #f97316, #fbbf24)", rarity: "rare", desc: "Awarded to players on fire. A blazing gradient badge that shows you mean business." },
      { slug: "phantom", name: "Phantom", type: "Avatar Border", price: "150", accent: "#a78bfa", gradient: "linear-gradient(135deg, #4c1d95, #6d28d9, #8b5cf6)", rarity: "rare", desc: "A mysterious violet border that fades into shadow. Perfect for the enigmatic player." },
      { slug: "emerald-crown", name: "Emerald Crown", type: "Badge", price: "350", accent: "#34d399", gradient: "linear-gradient(135deg, #047857, #059669, #10b981)", rarity: "epic", desc: "A regal emerald badge reserved for true champions. Worn by the elite few." },
      { slug: "bloodline", name: "Bloodline", type: "Card Theme", price: "300", accent: "#f43f5e", gradient: "linear-gradient(135deg, #9f1239, #e11d48, #fb7185)", rarity: "epic", desc: "Deep crimson theme that commands respect. For those who dominate the leaderboard." },
      { slug: "minimal", name: "Minimal", type: "Avatar Border", price: "40", accent: "#a1a1aa", gradient: "linear-gradient(135deg, #3f3f46, #52525b, #71717a)", rarity: "common", desc: "A subtle, understated border for those who prefer simplicity over flash." },
      { slug: "sakura", name: "Sakura", type: "Card Theme", price: "180", accent: "#f9a8d4", gradient: "linear-gradient(135deg, #ec4899, #f472b6, #fbcfe8)", rarity: "rare", desc: "Soft cherry blossom pinks that bring a touch of spring to your profile." },
      { slug: "stormfront", name: "Stormfront", type: "Avatar Border", price: "250", accent: "#60a5fa", gradient: "linear-gradient(135deg, #1e40af, #3b82f6, #93c5fd)", rarity: "epic", desc: "Electric blue border crackling with storm energy. Impossible to ignore." },
      { slug: "crown-jewel", name: "Crown Jewel", type: "Badge", price: "400", accent: "#fde68a", gradient: "linear-gradient(135deg, #a16207, #ca8a04, #facc15)", rarity: "legendary", desc: "The ultimate status symbol. A golden badge that sparkles with prestige." },
      { slug: "toxic", name: "Toxic", type: "Card Theme", price: "100", accent: "#a3e635", gradient: "linear-gradient(135deg, #3f6212, #65a30d, #84cc16)", rarity: "uncommon", desc: "Acid green theme that radiates toxic energy. Not for the faint-hearted." },
      { slug: "shadow", name: "Shadow", type: "Avatar Border", price: "60", accent: "#71717a", gradient: "linear-gradient(135deg, #18181b, #27272a, #3f3f46)", rarity: "common", desc: "A dark, almost invisible border that blends into the void. Stealth mode." },
      { slug: "cyber", name: "Cyber", type: "Badge", price: "220", accent: "#22d3ee", gradient: "linear-gradient(135deg, #0e7490, #06b6d4, #67e8f9)", rarity: "rare", desc: "Futuristic cyan badge with a digital edge. Straight out of the grid." },
      { slug: "infernal", name: "Infernal", type: "Card Theme", price: "450", accent: "#ef4444", gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #f87171)", rarity: "legendary", desc: "Born from the depths. A legendary theme of fire and fury for the fearless." },
      { slug: "aurora", name: "Aurora", type: "Avatar Border", price: "280", accent: "#a78bfa", gradient: "linear-gradient(135deg, #5b21b6, #7c3aed, #c4b5fd)", rarity: "epic", desc: "Shimmering violet border inspired by the northern lights. Mesmerizing." },
    ];

    for (const item of items) {
      await ctx.db.insert("marketplaceItems", item);
    }
  },
});
