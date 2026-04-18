import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { anyApi } from "convex/server";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Please set VITE_CONVEX_URL or CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("=================================================");
  console.log(" Running Convex Limits Audit...");
  console.log("=================================================");

  try {
    const stats: Record<string, { count: number; avgDocSizeBytes: number; danger: boolean }> = 
      await client.query(anyApi.audit.getTableStats as any, {});

    const SCAN_LIMIT = 32000;
    const RETURN_LIMIT_BYTES = 16 * 1024 * 1024; // 16 MiB

    for (const [table, data] of Object.entries(stats)) {
      console.log(`\n📦 Table: ${table}`);
      
      if (data.count === -1) {
        console.log(`  ❌ CRITICAL DANGER: Table failed to process.`);
        console.log(`  Reason: Table has either surpassed the ${SCAN_LIMIT} scan limit or the 16 MiB read transaction boundary.`);
        console.log(`  Action Needed: Convert all .collect() references for this table into paginated queries immediately.`);
        continue;
      }

      console.log(`  Rows found: ${data.count}`);
      console.log(`  Avg Row Size: ~${Math.round(data.avgDocSizeBytes)} Bytes`);

      const estimatedTotalBytes = data.count * data.avgDocSizeBytes;
      const mbSize = (estimatedTotalBytes / (1024 * 1024)).toFixed(2);
      
      console.log(`  Estimated Total Size: ~${mbSize} MiB`);

      if (data.count > 10000) {
        console.log(`  ⚠️  WARNING: Row count is approaching the ${SCAN_LIMIT} scan limit. Ensure pagination is utilized.`);
      }
      
      if (estimatedTotalBytes > (RETURN_LIMIT_BYTES * 0.5)) {
        console.log(`  ⚠️  WARNING: Total payload size is approaching the 16 MiB transaction return limit.`);
      }

      if (!data.danger && data.count <= 10000 && estimatedTotalBytes <= (RETURN_LIMIT_BYTES * 0.5)) {
        console.log(`  ✅ Health check passed. Within safe bounds.`);
      }
    }

    console.log("\n=================================================");
    console.log(" Audit Complete.");
    console.log(" For full real-time analysis, check the 'Health & Insights' panel in your Convex Deployment Dashboard.");
    console.log("=================================================\n");

  } catch (err) {
    console.error("Failed to run audit query:", err);
  }
}

main().catch(console.error);
