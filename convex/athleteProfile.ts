// convex/athleteProfile.ts
// Self-rated athlete profile (Power/Speed/Cardio/Endurance/Flexibility/Effectiveness),
// captured once at onboarding and editable afterwards from the profile page.
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

const RATING_FIELDS = [
  "power",
  "speed",
  "cardio",
  "endurance",
  "flexibility",
  "effectiveness",
] as const;

const ratingArgs = {
  power: v.number(),
  speed: v.number(),
  cardio: v.number(),
  endurance: v.number(),
  flexibility: v.number(),
  effectiveness: v.number(),
};

export const getMyAthleteProfile = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("athleteProfiles")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .unique();
  },
});

export const upsertMyAthleteProfile = mutation({
  args: ratingArgs,
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);

    for (const field of RATING_FIELDS) {
      const value = args[field];
      if (!Number.isFinite(value) || value < 1 || value > 10) {
        throw new Error(`${field} must be a number between 1 and 10.`);
      }
    }

    const existing = await ctx.db
      .query("athleteProfiles")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("athleteProfiles", {
      userId: me._id,
      ...args,
      updatedAt: Date.now(),
    });
  },
});
