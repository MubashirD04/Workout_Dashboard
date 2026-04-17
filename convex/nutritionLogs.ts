import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getNutritionLogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("nutritionLogs").order("desc").collect();
  },
});

export const createNutritionLog = mutation({
  args: {
    date: v.string(),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nutritionLogs", args);
  },
});

export const deleteNutritionLog = mutation({
  args: { id: v.id("nutritionLogs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
