// convex/inviteCodes.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getAuthenticatedUser,
  requireTrainerOrAdmin,
} from "./lib/auth";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateCode(): string {
  // 8-char alphanumeric code (avoids ambiguous chars O/0, I/1)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─────────────────────────────────────────────────────────────
// Trainer — generate a new invite code
// ─────────────────────────────────────────────────────────────

export const generateInviteCode = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    requireTrainerOrAdmin(me);

    // SECURITY: Rate limit (max 10 active unused codes per trainer)
    const activeCodes = await ctx.db
      .query("inviteCodes")
      .withIndex("by_trainer", (q) => q.eq("trainerId", me._id))
      .collect();
    const unusedCount = activeCodes.filter(c => !c.usedBy && c.expiresAt > Date.now()).length;
    
    if (unusedCount >= 10) {
      throw new Error("Maximum of 10 active invite codes reached. Revoke an unused code to create a new one.");
    }

    const now = Date.now();
    const code = generateCode();

    const id = await ctx.db.insert("inviteCodes", {
      code,
      trainerId: me._id,
      expiresAt: now + EXPIRY_MS,
      createdAt: now,
    });

    return { code, expiresAt: now + EXPIRY_MS, id };
  },
});

// ─────────────────────────────────────────────────────────────
// Trainer — list their active (unused, unexpired) codes
// ─────────────────────────────────────────────────────────────

export const getMyInviteCodes = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    requireTrainerOrAdmin(me);

    const now = Date.now();
    const codes = await ctx.db
      .query("inviteCodes")
      .withIndex("by_trainer", (q) => q.eq("trainerId", me._id))
      .collect();

    return codes.filter((c) => !c.usedBy && c.expiresAt > now);
  },
});

// ─────────────────────────────────────────────────────────────
// Trainer — revoke / delete an unused code
// ─────────────────────────────────────────────────────────────

export const revokeInviteCode = mutation({
  args: { codeId: v.id("inviteCodes") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireTrainerOrAdmin(me);

    const code = await ctx.db.get(args.codeId);
    if (!code) throw new Error("Invite code not found.");
    if (code.trainerId !== me._id && me.role !== "admin") {
      throw new Error("Forbidden: not your invite code.");
    }
    if (code.usedBy) throw new Error("Code already used, cannot revoke.");

    await ctx.db.delete(args.codeId);
  },
});

// ─────────────────────────────────────────────────────────────
// Client — preview a code (validate before claiming, no side-effects)
// ─────────────────────────────────────────────────────────────

export const previewInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!record) return { valid: false, reason: "Code not found." };
    if (record.usedBy) return { valid: false, reason: "Code already used." };
    if (record.expiresAt < Date.now()) return { valid: false, reason: "Code expired." };

    const trainer = await ctx.db.get(record.trainerId);
    return {
      valid: true,
      trainerName: trainer?.name ?? "Unknown Trainer",
      expiresAt: record.expiresAt,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// Client — claim an invite code, linking them to the trainer
// ─────────────────────────────────────────────────────────────

export const claimInviteCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);

    if (me.role !== "client") {
      throw new Error("Only clients can claim invite codes.");
    }
    if (me.trainerId) {
      throw new Error("You are already assigned to a trainer.");
    }

    // SECURITY: This block is a single ACID transaction in Convex.
    // The check for record.usedBy and the subsequent patch are atomic, 
    // protecting against race conditions (TOCTOU).
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!record) throw new Error("Invalid invite code.");
    if (record.usedBy) throw new Error("This code has already been used.");
    if (record.expiresAt < Date.now()) throw new Error("This invite code has expired.");

    const now = Date.now();

    // Link client → trainer
    await ctx.db.patch(me._id, { trainerId: record.trainerId });

    // Mark code as used
    await ctx.db.patch(record._id, { usedBy: me._id, usedAt: now });

    const trainer = await ctx.db.get(record.trainerId);
    return { success: true, trainerName: trainer?.name };
  },
});
