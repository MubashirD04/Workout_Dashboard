import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workouts: defineTable({
    date: v.string(), // 'YYYY-MM-DD'
    notes: v.optional(v.string()),
    time: v.optional(v.string()), // e.g. HH:MM
    duration: v.optional(v.number()), // in minutes
    exercises: v.array(
      v.object({
        exercise_name: v.string(),
        sets: v.number(),
        reps: v.number(),
        weight: v.number(),
      })
    ),
  }),

  cardioLogs: defineTable({
    date: v.string(), // 'YYYY-MM-DD'
    type: v.string(),
    distance: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    time: v.optional(v.string()),
  }),

  bodyMetrics: defineTable({
    date: v.string(), // 'YYYY-MM-DD'
    weight: v.optional(v.number()),
    height: v.optional(v.number()),
    body_fat_perc: v.optional(v.number()),
    chest: v.optional(v.number()),
    waist: v.optional(v.number()),
    hips: v.optional(v.number()),
    bicep: v.optional(v.number()),
    thigh: v.optional(v.number()),
  }),

  nutritionLogs: defineTable({
    date: v.string(), // 'YYYY-MM-DD'
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
  }),

  progressPhotos: defineTable({
    date: v.string(), // 'YYYY-MM-DD'
    photo_url: v.string(),
    notes: v.optional(v.string()),
  }),

  conversations: defineTable({
    created_at: v.number(), // timestamp
    updated_at: v.number(), // timestamp
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    sources: v.optional(v.array(v.string())),
    created_at: v.number(), // timestamp
  }),

  bookKnowledge: defineTable({
    book_title: v.string(),
    chunk_index: v.number(),
    content: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768, // Google Gemini uses 768 dimensions for text-embedding-004 by default usually. We will use Google Gemini Embeddings.
  }),
});
