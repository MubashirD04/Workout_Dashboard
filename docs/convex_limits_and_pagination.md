# Convex Limits & Pagination Strategy

This document serves as a reference for understanding the strict transactional limits imposed by the Convex serverless architecture, and how to use pagination patterns to ensure the Workout Dashboard scales without breaking.

## Why This Matters

Convex functions (queries and mutations) run inside fully ACID-compliant transactions. These transactions have strict budgets for execution time, memory, and database reads/writes. If a function exceeds these budgets, it will fail and return an error to the client.

As our database grows—especially with the introduction of thousands of AI RAG knowledge chunks and historical workout logs—unbounded queries like `.collect()` become a significant scaling risk.

## Current Convex Protocol Limits

> [!CAUTION]
> Treat these numbers as hard ceilings. If a function is within 50% of these bounds, it must be rewritten using cursor-based pagination.

| Resource | Hard Limit | Danger Zone |
| :--- | :--- | :--- |
| **Execution Time** | `1 Second` (User code only) | > `500 ms` |
| **Data Read/Written** | `16 MiB` per transaction | > `8 MiB` |
| **Documents Scanned** | `32,000` (Including filtered out docs) | > `10,000` |
| **Index Ranges Read** | `4,096` index scan boundaries | > `2,000` |
| **Individual Document Size** | `1 MiB` | > `500 KB` |
| **Return Value Payload** | `16 MiB` | > `2 MiB` (UI latency begins) |

*(Note: Background **Actions** can run for up to 10 minutes, but cannot directly read or write to the database. They must rely on sub-queries and sub-mutations that still adhere to the 1-second limits.)*

---

## The Pagination Strategy

To mitigate these limits, use Convex's built-in `paginate()` mechanics rather than `.collect()`.

### 1. Backend: Chunking Large Operations
If you need to process or read a vast number of rows on the backend (e.g. migrating schemas or re-computing stats), you should break the mutation into self-scheduling batches using cursors.

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const batchProcess = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // 1. Fetch exactly what we can afford to compute in ~200ms
    const batchSize = 100; 
    
    const results = await ctx.db
      .query("someLargeTable")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    // 2. Perform work
    for (const doc of results.page) {
       await ctx.db.patch(doc._id, { processed: true });
    }

    // 3. Self-schedule the next batch if there are more
    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.someFile.batchProcess, {
        cursor: results.continueCursor,
      });
    }
  },
});
```

### 2. Frontend: Lazy Loading UI
For rendering lists in the React dashboard (like history tables or timelines), never fetch all user history at once. Utilize `usePaginatedQuery`.

```tsx
import { usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function WorkoutHistory() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.workouts.getWorkoutHistory,
    {}, // standard args
    { initialNumItems: 20 } // React paginator opts
  );

  return (
    <div>
      {/* Map results... */}
      {status === "CanLoadMore" && (
         <button onClick={() => loadMore(20)}>Load More</button>
      )}
    </div>
  );
}
```

---

## Proactive Auditing & Monitoring

While Convex does not offer a free-tier "Storage Quota Percentage" endpoint to query within `schema.ts`, you can run our local audit script to sample document sizes and fetch deep table counts to identify danger zones.

### Running the Audit Script

Run this command locally to check if our tables are getting near the `32,000` scan limits:

```bash
npx tsx scripts/auditLimits.ts
```

> [!NOTE]
> If a table reports `> 10,000 rows`, manually search the codebase for `.collection()` references against that table and upgrade them to use `.paginate()` immediately.
