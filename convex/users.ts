// convex/users.ts
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
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

    // Any role change resolves a pending trainer request one way or another
    // (granting trainer fulfills it; anything else supersedes it).
    await ctx.db.patch(args.targetUserId, {
      role: args.role,
      trainerRequestedAt: undefined,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Client — request trainer access (admin still has to approve it)
// ─────────────────────────────────────────────────────────────

export const requestTrainerAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    if (me.role !== "client") {
      throw new Error("Only client accounts can request trainer access.");
    }
    if (me.trainerRequestedAt !== undefined) {
      throw new Error("You already have a pending trainer request.");
    }

    await ctx.db.patch(me._id, { trainerRequestedAt: Date.now() });
  },
});

export const cancelTrainerRequest = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    if (me.trainerRequestedAt === undefined) {
      throw new Error("You don't have a pending trainer request.");
    }

    await ctx.db.patch(me._id, { trainerRequestedAt: undefined });
  },
});

// ─────────────────────────────────────────────────────────────
// Admin — review pending trainer requests
// ─────────────────────────────────────────────────────────────

export const listPendingTrainerRequests = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    return await ctx.db
      .query("users")
      .withIndex("by_trainer_request", (q) => q.gt("trainerRequestedAt", 0))
      .collect();
  },
});

export const denyTrainerRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    const target = await ctx.db.get(args.targetUserId);
    if (!target || target.trainerRequestedAt === undefined) {
      throw new Error("No pending trainer request for this user.");
    }

    await ctx.db.patch(args.targetUserId, { trainerRequestedAt: undefined });
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
      .paginate(args.paginationOpts);
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

    const target = await ctx.db.get(args.targetUserId);
    if (!target) throw new Error("User not found.");

    await cascadeDeleteUser(ctx, target);

    // Also remove the underlying Clerk account, so the two stores can't
    // drift apart (deleted-in-app user could otherwise still sign back in).
    await ctx.scheduler.runAfter(0, internal.users.deleteClerkUser, {
      clerkId: target.clerkId,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Clerk → Convex sync — called from the clerk webhook (convex/http.ts)
// when a user is deleted directly in Clerk, so their Convex data
// doesn't outlive their account.
// ─────────────────────────────────────────────────────────────

export const deleteUserByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const target = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // Nothing to do — user never signed in, or was already removed.
    if (!target) return;

    await cascadeDeleteUser(ctx, target);
  },
});

async function cascadeDeleteUser(ctx: MutationCtx, target: Doc<"users">) {
  await ctx.db.delete(target._id);

  // Unassign any clients who had this user as their trainer, so
  // getMyClients/etc. don't dangle on a deleted trainerId.
  if (target.role === "trainer") {
    const orphanedClients = await ctx.db
      .query("users")
      .withIndex("by_trainer", (q) => q.eq("trainerId", target._id))
      .collect();
    for (const clientDoc of orphanedClients) {
      await ctx.db.patch(clientDoc._id, { trainerId: undefined });
    }
  }

  // Cascade-delete the user's fitness data in the background, batched the
  // same way message cleanup is (see chat.deleteMessagesBatch).
  for (const table of USER_SCOPED_TABLES) {
    await ctx.scheduler.runAfter(0, internal.users.deleteUserDataBatch, {
      userId: target._id,
      table,
    });
  }
  await ctx.scheduler.runAfter(0, internal.users.deleteUserConversationsBatch, {
    userId: target._id,
  });
}

// ─────────────────────────────────────────────────────────────
// Convex → Clerk sync — deletes the Clerk-side account when an admin
// deletes the user from within the app.
// ─────────────────────────────────────────────────────────────

export const deleteClerkUser = internalAction({
  args: { clerkId: v.string() },
  handler: async (_ctx, args) => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("CLERK_SECRET_KEY not set — skipping Clerk-side user deletion.");
      return;
    }

    const res = await fetch(`https://api.clerk.com/v1/users/${args.clerkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    // 404 means the Clerk account is already gone — not an error here.
    if (!res.ok && res.status !== 404) {
      console.error(
        `Failed to delete Clerk user ${args.clerkId}: ${res.status} ${await res.text()}`
      );
    }
  },
});

const USER_SCOPED_TABLES = [
  "workouts",
  "cardioLogs",
  "bodyMetrics",
  "nutritionLogs",
  "progressPhotos",
] as const;

export const deleteUserDataBatch = internalMutation({
  args: {
    userId: v.id("users"),
    table: v.union(
      v.literal("workouts"),
      v.literal("cardioLogs"),
      v.literal("bodyMetrics"),
      v.literal("nutritionLogs"),
      v.literal("progressPhotos")
    ),
  },
  handler: async (ctx, args) => {
    const batchSize = 100;
    const batch = await ctx.db
      .query(args.table)
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(batchSize);

    for (const doc of batch) await ctx.db.delete(doc._id);

    if (batch.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.users.deleteUserDataBatch, args);
    }
  },
});

export const deleteUserConversationsBatch = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const batchSize = 20;
    const batch = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(batchSize);

    for (const convo of batch) {
      await ctx.scheduler.runAfter(0, internal.chat.deleteMessagesBatch, {
        conversationId: convo._id,
      });
      await ctx.db.delete(convo._id);
    }

    if (batch.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.users.deleteUserConversationsBatch, args);
    }
  },
});
