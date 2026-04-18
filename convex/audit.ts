import { query } from "./_generated/server";
import { getConvexSize } from "convex/values";

/**
 * Returns document counts and estimated byte sizes for the major tables.
 * Used exclusively by the auditLimits.ts health checking script.
 */
export const getTableStats = query({
  args: {},
  handler: async (ctx) => {
    const stats: Record<string, { count: number; avgDocSizeBytes: number; danger: boolean }> = {};
    const tables = ["bookKnowledge", "workouts", "cardioLogs", "bodyMetrics", "nutritionLogs"];

    for (const table of tables) {
      try {
        // Warning: This collects all rows to strictly count them. 
        // If it throws an execution limits error, the table has exceeded the 32k scan threshold.
        // For larger tables, you'd migrate this to a cron-driven digest table instead.
        const allDocs = await (ctx.db.query as any)(table).collect();
        const count = allDocs.length;
        
        let avgSize = 0;
        if (count > 0) {
          // Sample the first 10 documents to compute an average size 
          // (much cheaper than validating getConvexSize on every record)
          const sampleSize = Math.min(count, 10);
          let totalBytes = 0;
          for (let i = 0; i < sampleSize; i++) {
              totalBytes += getConvexSize(allDocs[i]);
          }
          avgSize = Math.round(totalBytes / sampleSize);
        }

        stats[table] = {
          count,
          avgDocSizeBytes: avgSize,
          danger: count > 10000 || avgSize > 250000, 
        };

      } catch (err: any) {
        // If we hit a 16MiB or 32k read limit, catch it and flag it as a critical danger
        stats[table] = {
          count: -1, 
          avgDocSizeBytes: -1,
          danger: true
        };
      }
    }

    return stats;
  },
});
