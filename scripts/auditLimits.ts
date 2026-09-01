import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prod = process.argv.includes("--prod");

/**
 * `audit.getTableChunk` is an internalQuery — it reads every row of any
 * table, so it isn't reachable over the public Convex API. Running it via
 * `npx convex run` uses real deployment credentials (the same ones needed
 * to deploy this project) instead of a request-supplied bypass secret.
 */
function runConvexQuery(functionName: string, args: Record<string, unknown>): any {
  const cliArgs = ["convex", "run", functionName, JSON.stringify(args)];
  if (prod) cliArgs.push("--prod");
  const output = execFileSync("npx", cliArgs, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const trimmed = output.trim();
  return trimmed ? JSON.parse(trimmed) : null;
}

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

    process.stdout.write("  Scanning... ");

    try {
      while (!isDone) {
        const result = runConvexQuery("audit:getTableChunk", {
          table,
          paginationOpts: {
            cursor,
            numItems: 1000,
          },
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
