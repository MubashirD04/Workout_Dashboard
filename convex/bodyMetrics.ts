// convex/bodyMetrics.ts
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthenticatedUser, assertCanReadUserData, assertCanWriteUserData } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

export const getBodyMetrics = query({
  args: { 
    targetUserId: v.optional(v.id("users")), 
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanReadUserData(ctx, me, targetId, false);

    return await ctx.db
      .query("bodyMetrics")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createBodyMetric = mutation({
  args: {
    targetUserId: v.optional(v.id("users")),
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
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanWriteUserData(ctx, me, targetId, false);

    const { targetUserId, ...rest } = args;
    return await ctx.db.insert("bodyMetrics", { ...rest, userId: targetId });
  },
});
