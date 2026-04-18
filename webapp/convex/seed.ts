import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const seedAll = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.games.seed, {});
    await ctx.runMutation(internal.marketplace.seed, {});
    return "Seeded games and marketplace items";
  },
});
