// convex/logs.ts
// Application/operational logging — separate from convex/audit.ts, which
// stays scoped to security-sensitive business events (role changes, invite
// claims, etc). This table is for error/warn/info visibility into things
// like the AI coach's external API calls.
import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireAdmin } from "./lib/auth";

const LOG_LEVEL = v.union(v.literal("info"), v.literal("warn"), v.literal("error"));

/**
 * Shared helper to write operational logs from mutations/actions.
 * Should be called via ctx.runMutation(internal.logs.writeLog, { ... })
 */
export const writeLog = internalMutation({
  args: {
    level: LOG_LEVEL,
    source: v.string(),
    message: v.string(),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Best-effort error logger for use inside catch blocks anywhere in the
 * backend. Never throws — a logging failure must never break the caller.
 */
export async function logError(
  ctx: { runMutation: (fn: any, args?: any) => Promise<any> },
  source: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    await ctx.runMutation(internal.logs.writeLog, {
      level: "error",
      source,
      message,
      metadata,
    });
  } catch {
    // Swallow — logging must never break the calling function.
  }
}

// ─────────────────────────────────────────────────────────────
// Retention — daily prune of logs older than 30 days.
// Mirrors the recursive self-scheduling batch pattern used by
// deleteMessagesBatch in convex/chat.ts.
// ─────────────────────────────────────────────────────────────

const LOG_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const pruneLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - LOG_RETENTION_MS;
    const batch = await ctx.db
      .query("logs")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(100);

    for (const log of batch) await ctx.db.delete(log._id);

    if (batch.length === 100) {
      await ctx.scheduler.runAfter(0, internal.logs.pruneLogs, {});
    }
  },
});

// ─────────────────────────────────────────────────────────────
// Admin log viewer
// ─────────────────────────────────────────────────────────────

export const getRecentLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    level: v.optional(LOG_LEVEL),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    if (args.level) {
      const level = args.level;
      return await ctx.db
        .query("logs")
        .withIndex("by_level_and_timestamp", (q) => q.eq("level", level))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("logs")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
