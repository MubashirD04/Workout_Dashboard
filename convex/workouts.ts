import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWorkouts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workouts").order("desc").collect();
  },
});

export const getWorkout = query({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createWorkout = mutation({
  args: {
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
    // Check for duplicate workout
    if (args.time) {
      const existing = await ctx.db
        .query("workouts")
        .filter((q) => q.eq(q.field("date"), args.date))
        .filter((q) => q.eq(q.field("time"), args.time))
        .first();

      if (existing) {
        throw new Error("A workout already exists at this date and time.");
      }
    }

    return await ctx.db.insert("workouts", {
      date: args.date,
      notes: args.notes,
      time: args.time,
      duration: args.duration,
      exercises: args.exercises,
    });
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteWorkout = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
