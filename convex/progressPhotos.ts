// convex/progressPhotos.ts
// ⚠️  Progress photos are NEVER accessible to trainers.
//     Only the owner (client) and admin can read or write.
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, assertCanReadUserData, assertCanWriteUserData } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

export const getProgressPhotos = query({
  args: { targetUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;

    // includePhotos: true → trainers will be rejected here
    await assertCanReadUserData(ctx, me, targetId, true);

    return await ctx.db
      .query("progressPhotos")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .order("desc")
      .collect();
  },
});

export const createProgressPhoto = mutation({
  args: {
    targetUserId: v.optional(v.id("users")),
    date: v.string(),
    photo_url: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;

    await assertCanWriteUserData(ctx, me, targetId, true);

    const { targetUserId, ...rest } = args;
    return await ctx.db.insert("progressPhotos", { ...rest, userId: targetId });
  },
});

export const deleteProgressPhoto = mutation({
  args: { id: v.id("progressPhotos") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const photo = await ctx.db.get(args.id);
    if (!photo) throw new Error("Photo not found.");

    await assertCanWriteUserData(ctx, me, photo.userId, true);
    await ctx.db.delete(args.id);
  },
});
