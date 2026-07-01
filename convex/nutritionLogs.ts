// convex/nutritionLogs.ts
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthenticatedUser, assertCanReadUserData, assertCanWriteUserData } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

export const getNutritionLogs = query({
  args: { 
    targetUserId: v.optional(v.id("users")), 
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanReadUserData(ctx, me, targetId, false);

    return await ctx.db
      .query("nutritionLogs")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createNutritionLog = mutation({
  args: {
    targetUserId: v.optional(v.id("users")),
    date: v.string(),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanWriteUserData(ctx, me, targetId, false);

    const { targetUserId, ...rest } = args;
    return await ctx.db.insert("nutritionLogs", { ...rest, userId: targetId });
  },
});

export const deleteNutritionLog = mutation({
  args: { id: v.id("nutritionLogs") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const log = await ctx.db.get(args.id);
    if (!log) throw new Error("Nutrition log not found.");
    await assertCanWriteUserData(ctx, me, log.userId, false);
    await ctx.db.delete(args.id);
  },
});
