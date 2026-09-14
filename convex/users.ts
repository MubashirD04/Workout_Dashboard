// convex/users.ts
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  getAuthenticatedUser,
  getAuthenticatedUserOrNull,
  requireAdmin,
  requireTrainerOrAdmin,
} from "./lib/auth";
import { recordAudit } from "./audit";
import { paginationOptsValidator } from "convex/server";

// Expected, user-facing failures throw ConvexError so the message survives to
// the client — Convex replaces plain Error messages with "Server Error" on
// production deployments.

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

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      clerkId,
      name,
      email,
      role,
      createdAt: Date.now(),
    });
    await recordAudit(ctx, {
      actorId: userId,
      action: "user.create",
      targetId: userId,
      metadata: { targetName: name, role, bootstrapAdmin: role === "admin" },
    });
    return userId;
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

    const target = await ctx.db.get(args.targetUserId);
    if (!target) throw new ConvexError("User not found.");

    await applyRoleChange(ctx, target, args.role);
    await recordAudit(ctx, {
      actorId: me._id,
      action: "user.setRole",
      targetId: target._id,
      metadata: { targetName: target.name, from: target.role, to: args.role },
    });
  },
});

/**
 * Shared by setUserRole and approveTrainerRequest. Keeps the role-dependent
 * fields consistent with the new role:
 *  - Any role change resolves a pending trainer request (granting trainer
 *    fulfills it; anything else supersedes it).
 *  - Leaving `client` clears the user's own trainer assignment.
 *  - Becoming `client` unassigns anyone who had this user as their trainer
 *    and revokes their unused invite codes (admins can hold clients too, so
 *    trainer ↔ admin keeps both).
 */
async function applyRoleChange(
  ctx: MutationCtx,
  target: Doc<"users">,
  role: Doc<"users">["role"]
) {
  // Prevent stripping the last admin
  if (target.role === "admin" && role !== "admin") {
    // SECURITY: Optimized with by_role index
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .take(2);
    if (admins.length <= 1) {
      throw new ConvexError("Cannot demote the last admin.");
    }
  }

  await ctx.db.patch(target._id, {
    role,
    trainerRequestedAt: undefined,
    ...(role !== "client" ? { trainerId: undefined } : {}),
  });

  if (role === "client" && target.role !== "client") {
    await unassignClientsOf(ctx, target._id);
    await revokeUnusedInviteCodes(ctx, target._id);
  }
}

async function unassignClientsOf(ctx: MutationCtx, trainerId: Id<"users">) {
  const clients = await ctx.db
    .query("users")
    .withIndex("by_trainer", (q) => q.eq("trainerId", trainerId))
    .collect();
  for (const clientDoc of clients) {
    await ctx.db.patch(clientDoc._id, { trainerId: undefined });
  }
}

async function revokeUnusedInviteCodes(ctx: MutationCtx, trainerId: Id<"users">) {
  const codes = await ctx.db
    .query("inviteCodes")
    .withIndex("by_trainer", (q) => q.eq("trainerId", trainerId))
    .collect();
  for (const code of codes) {
    if (!code.usedBy) await ctx.db.delete(code._id);
  }
}

// ─────────────────────────────────────────────────────────────
// Client — request trainer access (admin still has to approve it)
// ─────────────────────────────────────────────────────────────

export const requestTrainerAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    if (me.role !== "client") {
      throw new ConvexError("Only client accounts can request trainer access.");
    }
    if (me.trainerRequestedAt !== undefined) {
      throw new ConvexError("You already have a pending trainer request.");
    }

    await ctx.db.patch(me._id, { trainerRequestedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: me._id,
      action: "trainerRequest.submit",
      targetId: me._id,
      metadata: { targetName: me.name },
    });
  },
});

export const cancelTrainerRequest = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    if (me.trainerRequestedAt === undefined) {
      throw new ConvexError("You don't have a pending trainer request.");
    }

    await ctx.db.patch(me._id, { trainerRequestedAt: undefined });
    await recordAudit(ctx, {
      actorId: me._id,
      action: "trainerRequest.cancel",
      targetId: me._id,
      metadata: { targetName: me.name, requestedAt: me.trainerRequestedAt },
    });
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

// Loads the target and confirms the request is still live, so a stale
// Approve/Deny click (the user withdrew, or another admin already acted)
// fails instead of acting on a request that no longer exists.
async function getPendingRequester(ctx: MutationCtx, targetUserId: Id<"users">) {
  const target = await ctx.db.get(targetUserId);
  if (!target || target.trainerRequestedAt === undefined || target.role !== "client") {
    throw new ConvexError("This trainer request is no longer pending.");
  }
  return target;
}

export const approveTrainerRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    const target = await getPendingRequester(ctx, args.targetUserId);
    await applyRoleChange(ctx, target, "trainer");
    await recordAudit(ctx, {
      actorId: me._id,
      action: "trainerRequest.approve",
      targetId: target._id,
      metadata: { targetName: target.name, from: "client", to: "trainer", requestedAt: target.trainerRequestedAt },
    });
  },
});

export const denyTrainerRequest = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    const target = await getPendingRequester(ctx, args.targetUserId);
    await ctx.db.patch(target._id, { trainerRequestedAt: undefined });
    await recordAudit(ctx, {
      actorId: me._id,
      action: "trainerRequest.deny",
      targetId: target._id,
      metadata: { targetName: target.name, requestedAt: target.trainerRequestedAt },
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Trainer — list my clients
// ─────────────────────────────────────────────────────────────

export const getMyClients = query({
  args: {
    paginationOpts: paginationOptsValidator,
    // "mine" (default): clients assigned to the caller, for trainers and
    // admins alike. "all": every client, admin-only. Admins used to always
    // get "all", so a client an admin unassigned still showed as theirs.
    scope: v.optional(v.union(v.literal("mine"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireTrainerOrAdmin(me);

    if (args.scope === "all") {
      requireAdmin(me);
      // SECURITY: Optimized with by_role index
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "client"))
        .paginate(args.paginationOpts);
    }

    // Role filter guards against legacy rows promoted before setUserRole
    // started clearing trainerId on leaving the client role.
    return await ctx.db
      .query("users")
      .withIndex("by_trainer", (q) => q.eq("trainerId", me._id))
      .filter((q) => q.eq(q.field("role"), "client"))
      .paginate(args.paginationOpts);
  },
});

// ─────────────────────────────────────────────────────────────
// Admin — users who can hold clients (trainers + admins), for the
// Admin Panel's trainer-assignment picker. Bounded rather than paginated:
// a dropdown can't page, and staff accounts are a small slice of users.
// ─────────────────────────────────────────────────────────────

const MAX_ASSIGNABLE_TRAINERS = 200;

export const listTrainers = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    const [trainers, admins] = await Promise.all(
      (["trainer", "admin"] as const).map((role) =>
        ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", role))
          .take(MAX_ASSIGNABLE_TRAINERS)
      )
    );

    return [...trainers, ...admins]
      .map(({ _id, name, email, role }) => ({ _id, name, email, role }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
      throw new ConvexError("Target user is not a client.");
    }

    if (args.trainerId !== undefined) {
      const trainer = await ctx.db.get(args.trainerId);
      if (!trainer || (trainer.role !== "trainer" && trainer.role !== "admin")) {
        throw new ConvexError("Assigned user is not a trainer.");
      }
    }

    await ctx.db.patch(args.clientId, { trainerId: args.trainerId });
    await recordAudit(ctx, {
      actorId: me._id,
      action: "user.assignTrainer",
      targetId: client._id,
      metadata: { targetName: client.name, from: client.trainerId ?? null, to: args.trainerId ?? null },
    });
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
      throw new ConvexError("Cannot delete yourself.");
    }

    const target = await ctx.db.get(args.targetUserId);
    if (!target) throw new ConvexError("User not found.");

    await cascadeDeleteUser(ctx, target);
    // targetId is kept as a plain string — the users row no longer exists.
    await recordAudit(ctx, {
      actorId: me._id,
      action: "user.delete",
      targetId: target._id,
      metadata: { targetName: target.name, email: target.email, role: target.role },
    });

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
    // No actorId: the deletion came from Clerk, not an admin in the app.
    await recordAudit(ctx, {
      action: "user.delete",
      targetId: target._id,
      metadata: { targetName: target.name, email: target.email, role: target.role, via: "clerkWebhook" },
    });
  },
});

async function cascadeDeleteUser(ctx: MutationCtx, target: Doc<"users">) {
  await ctx.db.delete(target._id);

  // Unassign any clients who had this user as their trainer, so
  // getMyClients/etc. don't dangle on a deleted trainerId. Admins can hold
  // clients too, so this isn't limited to the trainer role.
  if (target.role !== "client") {
    await unassignClientsOf(ctx, target._id);
  }

  // Cascade-delete the user's data in the background, batched the same way
  // message cleanup is (see chat.deleteMessagesBatch).
  for (const table of USER_SCOPED_TABLES) {
    await ctx.scheduler.runAfter(0, internal.users.deleteUserDataBatch, {
      userId: target._id,
      table,
    });
  }
  await ctx.scheduler.runAfter(0, internal.users.deleteUserConversationsBatch, {
    userId: target._id,
  });
  await ctx.scheduler.runAfter(0, internal.users.deleteUserAiRequestsBatch, {
    userId: target._id,
  });
  await ctx.scheduler.runAfter(0, internal.users.deleteUserInviteCodesBatch, {
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
  "athleteProfiles",
] as const;

export const deleteUserDataBatch = internalMutation({
  args: {
    userId: v.id("users"),
    table: v.union(
      v.literal("workouts"),
      v.literal("cardioLogs"),
      v.literal("bodyMetrics"),
      v.literal("nutritionLogs"),
      v.literal("progressPhotos"),
      v.literal("athleteProfiles")
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

export const deleteUserAiRequestsBatch = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const batchSize = 100;
    const batch = await ctx.db
      .query("aiRequestLog")
      .withIndex("by_user_and_time", (q) => q.eq("userId", args.userId))
      .take(batchSize);

    for (const doc of batch) await ctx.db.delete(doc._id);

    if (batch.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.users.deleteUserAiRequestsBatch, args);
    }
  },
});

// Codes this user generated as a trainer/admin. Claimed codes go too — the
// clients they linked are already unassigned by cascadeDeleteUser.
export const deleteUserInviteCodesBatch = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const batchSize = 100;
    const batch = await ctx.db
      .query("inviteCodes")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.userId))
      .take(batchSize);

    for (const doc of batch) await ctx.db.delete(doc._id);

    if (batch.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.users.deleteUserInviteCodesBatch, args);
    }
  },
});
