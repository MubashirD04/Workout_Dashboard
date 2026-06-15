// convex/audit.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
