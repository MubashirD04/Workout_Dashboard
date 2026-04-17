import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCardioLogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cardioLogs").order("desc").collect();
  },
});

export const getCardioLog = query({
  args: { id: v.id("cardioLogs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createCardioLog = mutation({
  args: {
    date: v.string(),
    type: v.string(),
    distance: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cardioLogs", { ...args });
  },
});

export const updateCardioLog = mutation({
  args: {
    id: v.id("cardioLogs"),
    date: v.optional(v.string()),
    type: v.optional(v.string()),
    distance: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteCardioLog = mutation({
  args: { id: v.id("cardioLogs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
