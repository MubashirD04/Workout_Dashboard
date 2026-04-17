import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getProgressPhotos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("progressPhotos").order("desc").collect();
  },
});

export const createProgressPhoto = mutation({
  args: {
    date: v.string(),
    photo_url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("progressPhotos", args);
  },
});
