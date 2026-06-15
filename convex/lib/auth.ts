// convex/lib/auth.ts
// Shared helpers for authentication & authorization.
// Import these into every Convex function that needs access control.

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// ─────────────────────────────────────────────────────────────
// Core identity helpers
// ─────────────────────────────────────────────────────────────

/**
 * Resolves the currently authenticated Convex user document.
 * Throws if the user is not authenticated or not yet in the users table.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: no identity found.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) {
    throw new Error("User not found. Please complete registration.");
  }

  return user;
}

/**
 * Returns the user or null — use in queries that must not throw for
 * unauthenticated visitors (e.g. public pages).
 */
export async function getAuthenticatedUserOrNull(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();
}

// ─────────────────────────────────────────────────────────────
// Role guards
// ─────────────────────────────────────────────────────────────

export function requireAdmin(user: { role: string }) {
  if (user.role !== "admin") {
    throw new Error("Forbidden: admin access required.");
  }
}

export function requireTrainerOrAdmin(user: { role: string }) {
  if (user.role !== "admin" && user.role !== "trainer") {
    throw new Error("Forbidden: trainer or admin access required.");
  }
}

// ─────────────────────────────────────────────────────────────
// Data access checks
// ─────────────────────────────────────────────────────────────

/**
 * Checks whether `requestingUser` can read the fitness data of `targetUserId`.
 *
 * Rules:
 *  - Admin    → can read anyone
 *  - Trainer  → can read only their assigned clients (NOT progress photos)
 *  - Client   → can only read their own data
 *
 * Pass `includePhotos: false` for endpoints a trainer is allowed to call,
 * and `includePhotos: true` only for photo-specific endpoints (blocks trainers).
 */
export async function assertCanReadUserData(
  ctx: QueryCtx | MutationCtx,
  requestingUser: { _id: Id<"users">; role: string; trainerId?: Id<"users"> },
  targetUserId: Id<"users">,
  includePhotos: boolean = false
) {
  if (requestingUser.role === "admin") return; // admin sees all

  if (includePhotos && requestingUser.role === "trainer") {
    throw new Error("Forbidden: trainers cannot access client progress photos.");
  }

  if (requestingUser.role === "trainer") {
    // Check that target user is a client assigned to this trainer
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser || targetUser.trainerId !== requestingUser._id) {
      throw new Error("Forbidden: this client is not assigned to you.");
    }
    return;
  }

  // Client — can only access own data
  if (requestingUser._id !== targetUserId) {
    throw new Error("Forbidden: you can only access your own data.");
  }
}

/**
 * Checks whether `requestingUser` can write/mutate the data of `targetUserId`.
 * Trainers can edit client fitness data (not photos).
 */
export async function assertCanWriteUserData(
  ctx: QueryCtx | MutationCtx,
  requestingUser: { _id: Id<"users">; role: string; trainerId?: Id<"users"> },
  targetUserId: Id<"users">,
  includePhotos: boolean = false
) {
  // Write rules mirror read rules for this app
  await assertCanReadUserData(ctx, requestingUser, targetUserId, includePhotos);
}
