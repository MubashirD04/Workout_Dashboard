// convex/audit.ts
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthenticatedUser, requireAdmin } from "./lib/auth";

// ─────────────────────────────────────────────────────────────
// Audit actions. Every audited action is listed here with its category so
// the admin viewer can filter by category through an index. Trainer-request
// approvals count as role changes, since approving is what grants the role.
// ─────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = {
  "user.create": "role",             // first sign-in; metadata.role is the initial role
  "user.setRole": "role",            // metadata: { from, to }
  "trainerRequest.approve": "role",  // client → trainer via request
  "trainerRequest.submit": "trainerRequest",
  "trainerRequest.cancel": "trainerRequest",
  "trainerRequest.deny": "trainerRequest",
  "user.assignTrainer": "assignment", // metadata: { from, to, via? }
  "user.delete": "deletion",          // metadata: { name, email, role, via? }
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;
export type AuditCategory = (typeof AUDIT_ACTIONS)[AuditAction];

const AUDIT_CATEGORY = v.union(
  v.literal("role"),
  v.literal("trainerRequest"),
  v.literal("assignment"),
  v.literal("deletion")
);

/**
 * Writes an audit row in the caller's own transaction — use this from
 * mutations, so the audit entry commits (or rolls back) with the change.
 * Include `targetName` in metadata for user-targeted actions so the entry
 * stays readable after the target is deleted.
 */
export async function recordAudit(
  ctx: MutationCtx,
  entry: {
    actorId?: Id<"users">;
    action: AuditAction;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("auditLogs", {
    ...entry,
    category: AUDIT_ACTIONS[entry.action],
    timestamp: Date.now(),
  });
}

/**
 * Same as recordAudit, for actions (which have no ctx.db).
 * Call via ctx.runMutation(internal.audit.writeAuditLog, { ... })
 */
export const writeAuditLog = internalMutation({
  args: {
    actorId: v.optional(v.id("users")),
    action: v.string(),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!(args.action in AUDIT_ACTIONS)) {
      throw new Error(`Unknown audit action: ${args.action}`);
    }
    await recordAudit(ctx, { ...args, action: args.action as AuditAction });
  },
});

// ─────────────────────────────────────────────────────────────
// Admin audit log viewer
// ─────────────────────────────────────────────────────────────

export const getRecentAuditLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(AUDIT_CATEGORY),
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    requireAdmin(me);

    const category = args.category;
    const result = category
      ? await ctx.db
          .query("auditLogs")
          .withIndex("by_category_and_timestamp", (q) => q.eq("category", category))
          .order("desc")
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("auditLogs")
          .withIndex("by_timestamp")
          .order("desc")
          .paginate(args.paginationOpts);

    // Resolve current names for every user referenced on this page (actor,
    // target, and assignment from/to), once per id. Deleted users resolve
    // to null; the viewer falls back to the metadata snapshot.
    const names = new Map<string, string | null>();
    const resolve = async (raw: unknown) => {
      if (typeof raw !== "string" || names.has(raw)) return;
      const id = ctx.db.normalizeId("users", raw);
      names.set(raw, id ? (await ctx.db.get(id))?.name ?? null : null);
    };

    for (const row of result.page) {
      await resolve(row.actorId);
      await resolve(row.targetId);
      if (row.action === "user.assignTrainer") {
        await resolve(row.metadata?.from);
        await resolve(row.metadata?.to);
      }
    }

    return {
      ...result,
      page: result.page.map((row) => ({
        ...row,
        category: row.category ?? AUDIT_ACTIONS[row.action as AuditAction] ?? null,
        names: Object.fromEntries(
          [
            row.actorId,
            row.targetId,
            // from/to are user ids only for assignments; for role changes they're role names.
            ...(row.action === "user.assignTrainer" ? [row.metadata?.from, row.metadata?.to] : []),
          ]
            .filter((id): id is string => typeof id === "string" && names.has(id))
            .map((id) => [id, names.get(id) ?? null])
        ) as Record<string, string | null>,
      })),
    };
  },
});

/**
 * One-off: stamps `category` on audit rows written before categories existed,
 * so they show up under the viewer's category filters.
 * Run: npx convex run audit:backfillAuditCategories
 */
export const backfillAuditCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("auditLogs")
      .withIndex("by_category_and_timestamp", (q) => q.eq("category", undefined))
      .take(100);

    let updated = 0;
    for (const row of rows) {
      const category = AUDIT_ACTIONS[row.action as AuditAction];
      if (category) {
        await ctx.db.patch(row._id, { category });
        updated++;
      }
    }

    // Only continue if this batch made progress — rows with unrecognised
    // actions stay uncategorised and would otherwise be re-read forever.
    if (rows.length === 100 && updated > 0) {
      await ctx.scheduler.runAfter(0, internal.audit.backfillAuditCategories, {});
    }
    return { updated };
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
 *
 * Internal-only: this reads every row of any table including `users`
 * and `inviteCodes`, so it must never be reachable over the public API.
 * Run it via `npx convex run audit:getTableChunk '<args>'`, which uses
 * real deployment credentials instead of a request-supplied secret.
 */
export const getTableChunk = internalQuery({
  args: {
    table: AUDITABLE_TABLES,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
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