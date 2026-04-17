import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBodyMetrics = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bodyMetrics").order("desc").collect();
  },
});

export const createBodyMetric = mutation({
  args: {
    date: v.string(),
    weight: v.optional(v.number()),
    height: v.optional(v.number()),
    body_fat_perc: v.optional(v.number()),
    chest: v.optional(v.number()),
    waist: v.optional(v.number()),
    hips: v.optional(v.number()),
    bicep: v.optional(v.number()),
    thigh: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bodyMetrics", args);
  },
});
