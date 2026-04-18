import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getUserCardTheme(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<string> {
  const settings = await ctx.db
    .query("userSettings")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return settings?.profileCardTheme ?? "default";
}
