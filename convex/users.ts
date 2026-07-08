// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  getAuthenticatedUserOrNull,
  requireAdmin,
  requireTrainerOrAdmin,
} from "./lib/auth";
import { paginationOptsValidator } from "convex/server";

// ─────────────────────────────────────────────────────────────
// Called on first sign-in to upsert the user record
// ─────────────────────────────────────────────────────────────

export const upsertCurrentUser = mutation({
  args: {}, // SECURITY: Removed name, email, clerkId args to prevent client-side spoofing
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    console.log("IDENTITY DEBUG:", JSON.stringify(identity));

    // Use verified identity claims
    const name = identity.name ?? "Unknown";
    const email = identity.email ?? "";
    const clerkId = identity.subject; // This is the stable Clerk user ID

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existing) {
      // Update name/email in case they changed in Clerk
      await ctx.db.patch(existing._id, {
        name,
        email,
      });
      return existing._id;
    }

    // First-ever sign-in — determine role:
    // SECURITY: Bootstrap check
    const anyUser = await ctx.db.query("users").first();
    const role = anyUser === null ? "admin" : "client";

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      clerkId,
      name,
      email,
      role,
      createdAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Current user
// ─────────────────────────────────────────────────────────────

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthenticatedUserOrNull(ctx);
  },
});

// ─────────────────────────────────────────────────────────────
// Admin — list all users
// ─────────────────────────────────────────────────────────────

export const listAllUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);
    return await ctx.db.query("users").paginate(args.paginationOpts);
  },
});

// ─────────────────────────────────────────────────────────────
// Admin — change a user's role
// ─────────────────────────────────────────────────────────────

export const setUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("trainer"),
      v.literal("client")
    ),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    // Prevent stripping the last admin
    if (args.role !== "admin") {
      const target = await ctx.db.get(args.targetUserId);
      if (target?.role === "admin") {
        // SECURITY: Optimized with by_role index
        const admins = await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", "admin"))
          .collect();
        if (admins.length <= 1) {
          throw new Error("Cannot demote the last admin.");
        }
      }
    }

    await ctx.db.patch(args.targetUserId, { role: args.role });
  },
});

// ─────────────────────────────────────────────────────────────
// Trainer — list my clients
// ─────────────────────────────────────────────────────────────

export const getMyClients = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireTrainerOrAdmin(me);

    // Admin sees all clients; trainer sees only their own
    if (me.role === "admin") {
      // SECURITY: Optimized with by_role index
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "client"))
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("users")
      .withIndex("by_trainer", (q) => q.eq("trainerId", me._id))
      .collect();
  },
});

// ─────────────────────────────────────────────────────────────
// Admin — assign a client to a trainer (or unassign)
// ─────────────────────────────────────────────────────────────

export const assignClientToTrainer = mutation({
  args: {
    clientId: v.id("users"),
    trainerId: v.optional(v.id("users")), // pass undefined to unassign
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    const client = await ctx.db.get(args.clientId);
    if (!client || client.role !== "client") {
      throw new Error("Target user is not a client.");
    }

    await ctx.db.patch(args.clientId, { trainerId: args.trainerId });
  },
});

// ─────────────────────────────────────────────────────────────
// Admin — delete a user
// ─────────────────────────────────────────────────────────────

export const deleteUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    if (me._id === args.targetUserId) {
      throw new Error("Cannot delete yourself.");
    }

    await ctx.db.delete(args.targetUserId);
  },
});
