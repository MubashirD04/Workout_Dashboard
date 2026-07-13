import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { api } from "../convex/_generated/api.js";

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

  const tables = [
    "users",
    "inviteCodes",
    "workouts",
    "cardioLogs",
    "bodyMetrics",
    "nutritionLogs",
    "progressPhotos",
    "conversations",
    "messages",
    "bookKnowledge",
    "auditLogs"
  ];
  const SCAN_LIMIT = 32000;
  const RETURN_LIMIT_BYTES = 16 * 1024 * 1024; // 16 MiB

  for (const table of tables) {
    console.log(`\n📦 Table: ${table}`);
    
    let totalCount = 0;
    let totalBytes = 0;
    let cursor: string | null = null;
    let isDone = false;
    let error = null;

    process.stdout.write("  Scanning... ");

    try {
      while (!isDone) {
        const result: any = await client.query(api.audit.getTableChunk, {
          table,
          paginationOpts: {
            cursor,
            numItems: 1000,
          },
          bypassKey: process.env.AUDIT_BYPASS_KEY,
        });

        totalCount += result.count;
        totalBytes += result.totalBytes;
        cursor = result.continueCursor;
        isDone = result.isDone;
        
        process.stdout.write(`${totalCount} `);
        
        // Safety break for audit
        if (totalCount > 1000000) {
          console.log("\n  ⚠️ Audit capped at 1M rows for performance.");
          break;
        }
      }
      console.log("Done.");

      const avgSize = totalCount > 0 ? Math.round(totalBytes / totalCount) : 0;
      const mbSize = (totalBytes / (1024 * 1024)).toFixed(2);
      
      console.log(`  Rows found: ${totalCount}`);
      console.log(`  Avg Row Size: ~${avgSize} Bytes`);
      console.log(`  Estimated Total Size: ~${mbSize} MiB`);

      if (totalCount > 10000) {
        console.log(`  ⚠️  WARNING: Row count exceeds 10k. Ensure all frontend queries are paginated.`);
      }
      
      if (totalBytes > (RETURN_LIMIT_BYTES * 0.5)) {
        console.log(`  ⚠️  WARNING: Total table size is over 8 MiB. Be careful with wide scans.`);
      }

      if (totalCount <= 10000 && totalBytes <= (RETURN_LIMIT_BYTES * 0.5)) {
        console.log(`  ✅ Health check passed. Within safe bounds.`);
      }

    } catch (err: any) {
      console.log("\n  ❌ Error auditing table:", err.message);
    }
  }

  console.log("\n=================================================");
  console.log(" Audit Complete.");
  console.log(" For full real-time analysis, check the 'Health & Insights' panel in your Convex Deployment Dashboard.");
  console.log("=================================================\n");
}

main().catch(console.error);
