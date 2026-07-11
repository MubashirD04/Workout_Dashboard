// convex/audit.ts
import { internalMutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthenticatedUser, requireAdmin } from "./lib/auth";

/**
 * Shared helper to write audit logs from mutations.
 * Should be called via ctx.runMutation(internal.audit.writeAuditLog, { ... })
 */
export const writeAuditLog = internalMutation({
  args: {
    actorId: v.id("users"),
    action: v.string(),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Table auditing — used by scripts/auditLimits.ts to sample row
// counts and estimated sizes WITHOUT collecting entire tables.
// ─────────────────────────────────────────────────────────────

// Keep this list in sync with schema.ts. Using a literal union (rather
// than a bare v.string()) means an invalid/typo'd table name fails
// validation immediately instead of throwing inside ctx.db.query().
const AUDITABLE_TABLES = v.union(
  v.literal("users"),
  v.literal("inviteCodes"),
  v.literal("workouts"),
  v.literal("cardioLogs"),
  v.literal("bodyMetrics"),
  v.literal("nutritionLogs"),
  v.literal("progressPhotos"),
  v.literal("conversations"),
  v.literal("messages"),
  v.literal("bookKnowledge"),
  v.literal("auditLogs")
);

/**
 * Returns one paginated chunk of a table, plus per-doc size estimates.
 * The caller (auditLimits.ts) repeatedly calls this with the returned
 * `continueCursor` until `isDone`, accumulating row counts and byte
 * totals client-side. This keeps each individual call well under the
 * 16 MiB return-value limit and the 32,000 documents-scanned limit,
 * even for large tables like `bookKnowledge`.
 */
export const getTableChunk = query({
  args: {
    table: AUDITABLE_TABLES,
    paginationOpts: paginationOptsValidator,
    bypassKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isBypass =
      process.env.CONVEX_DEPLOYMENT_TYPE === "development" ||
      (!!process.env.AUDIT_BYPASS_KEY &&
        args.bypassKey === process.env.AUDIT_BYPASS_KEY);

    if (!isBypass) {
      const me = await getAuthenticatedUser(ctx);
      requireAdmin(me);
    }

    const result = await ctx.db
      .query(args.table)
      .paginate(args.paginationOpts);

    // Estimate size the same way the audit script's report does:
    // JSON-serialized byte length per document. This is an approximation
    // (Convex's internal encoding differs slightly) but is stable and
    // cheap to compute, and matches what auditLimits.ts expects back.
    const docs = result.page.map((doc) => {
      const size = new TextEncoder().encode(JSON.stringify(doc)).length;
      return { id: doc._id, size };
    });

    const totalBytes = docs.reduce((sum, d) => sum + d.size, 0);

    return {
      count: docs.length,
      totalBytes,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});