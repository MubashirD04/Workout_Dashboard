// convex/workouts.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser, assertCanReadUserData, assertCanWriteUserData } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

export const getWorkouts = query({
  args: {
    // Optional: trainer/admin can pass a clientId to view their data
    targetUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;

    await assertCanReadUserData(ctx, me, targetId, false);

    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .order("desc")
      .collect();
  },
});

export const getWorkout = query({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const workout = await ctx.db.get(args.id);
    if (!workout) return null;

    await assertCanReadUserData(ctx, me, workout.userId, false);
    return workout;
  },
});

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

export const createWorkout = mutation({
  args: {
    targetUserId: v.optional(v.id("users")),
    date: v.string(),
    notes: v.optional(v.string()),
    time: v.optional(v.string()),
    duration: v.optional(v.number()),
    exercises: v.array(
      v.object({
        exercise_name: v.string(),
        sets: v.number(),
        reps: v.number(),
        weight: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;

    await assertCanWriteUserData(ctx, me, targetId, false);

    if (args.time) {
      const existing = await ctx.db
        .query("workouts")
        .withIndex("by_user", (q) => q.eq("userId", targetId))
        .filter((q) =>
          q.and(
            q.eq(q.field("date"), args.date),
            q.eq(q.field("time"), args.time)
          )
        )
        .first();

      if (existing) {
        throw new Error("A workout already exists at this date and time.");
      }
    }

    const { targetUserId, ...rest } = args;
    return await ctx.db.insert("workouts", { ...rest, userId: targetId });
  },
});

export const updateWorkout = mutation({
  args: {
    id: v.id("workouts"),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    time: v.optional(v.string()),
    duration: v.optional(v.number()),
    exercises: v.optional(
      v.array(
        v.object({
          exercise_name: v.string(),
          sets: v.number(),
          reps: v.number(),
          weight: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const workout = await ctx.db.get(args.id);
    if (!workout) throw new Error("Workout not found.");

    await assertCanWriteUserData(ctx, me, workout.userId, false);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteWorkout = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const workout = await ctx.db.get(args.id);
    if (!workout) throw new Error("Workout not found.");

    await assertCanWriteUserData(ctx, me, workout.userId, false);
    await ctx.db.delete(args.id);
  },
});
