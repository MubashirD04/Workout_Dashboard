// convex/cardioLogs.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, assertCanReadUserData, assertCanWriteUserData } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

export const getCardioLogs = query({
  args: { targetUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanReadUserData(ctx, me, targetId, false);

    return await ctx.db
      .query("cardioLogs")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .order("desc")
      .collect();
  },
});

export const getCardioLog = query({
  args: { id: v.id("cardioLogs") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const log = await ctx.db.get(args.id);
    if (!log) return null;
    await assertCanReadUserData(ctx, me, log.userId, false);
    return log;
  },
});

export const createCardioLog = mutation({
  args: {
    targetUserId: v.optional(v.id("users")),
    date: v.string(),
    type: v.string(),
    distance: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanWriteUserData(ctx, me, targetId, false);

    const { targetUserId, ...rest } = args;
    return await ctx.db.insert("cardioLogs", { ...rest, userId: targetId });
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
    const me = await getAuthenticatedUser(ctx);
    const log = await ctx.db.get(args.id);
    if (!log) throw new Error("Cardio log not found.");
    await assertCanWriteUserData(ctx, me, log.userId, false);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteCardioLog = mutation({
  args: { id: v.id("cardioLogs") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const log = await ctx.db.get(args.id);
    if (!log) throw new Error("Cardio log not found.");
    await assertCanWriteUserData(ctx, me, log.userId, false);
    await ctx.db.delete(args.id);
  },
});
