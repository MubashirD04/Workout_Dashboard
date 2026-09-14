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

## Current State

**Frontend:** History pages (`WorkoutLog`, `CardioTracker`, `BodyMetrics`, `NutritionTracker`, `ProgressPhotos`) and admin/trainer views (`AdminPanel`, `ClientsView`) call `usePaginatedQuery` against the paginated backend queries below.

**Backend:** `getWorkouts`, `getCardioLogs`, `getBodyMetrics`, `getNutritionLogs`, `getProgressPhotos`, `listAllUsers`, `getMyClients`, and `logs.getRecentLogs` all accept `paginationOpts` and return `.paginate()` results. The migration of these core listing queries is fully complete. The remaining `.collect()` calls are on small, index-narrowed sets: `users.listPendingTrainerRequests` (pending requests only), `users.setUserRole`'s last-admin count (`by_role` = admin), `cascadeDeleteUser`/`setUserRole`'s client-unassign lookup (`by_trainer`), and `users.listTrainers`, which uses `.take(200)` per role because it feeds a dropdown that can't page. Paginate `listPendingTrainerRequests` if request volume ever grows. Bulk deletes over unbounded tables (`chat.deleteMessagesBatch`, `chat.clearChunksBatch`, `logs.pruneLogs`) use the recursive `.take(100)` + `ctx.scheduler.runAfter(0, ...)` self-batching pattern instead.

The legacy `client/src/api/` wrapper layer (which called functions by string name without `paginationOpts`) and the `useFetch` hook have been removed. All pages use the Convex React hooks (`useQuery`/`usePaginatedQuery`/`useMutation`/`useAction`) directly, typed via the generated `api`.
---

## The Pagination Strategy

To mitigate these limits, use Convex's built-in `paginate()` mechanics rather than `.collect()`.

### 1. Backend: Paginated List Queries

List queries should accept `paginationOpts` and return a paginated result:

```typescript
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthenticatedUser, assertCanReadUserData } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

export const getWorkouts = query({
  args: {
    targetUserId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const targetId: Id<"users"> = args.targetUserId ?? me._id;
    await assertCanReadUserData(ctx, me, targetId, false);

    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

### 2. Backend: Chunking Large Batch Operations

If you need to process or read a vast number of rows on the backend (e.g. migrating schemas or re-computing stats), break the mutation into self-scheduling batches using cursors.

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const batchProcess = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const batchSize = 100;

    const results = await ctx.db
      .query("someLargeTable")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    for (const doc of results.page) {
      await ctx.db.patch(doc._id, { processed: true });
    }

    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.someFile.batchProcess, {
        cursor: results.continueCursor,
      });
    }
  },
});
```

### 3. Frontend: Lazy Loading UI

For rendering lists in the React dashboard (history tables, timelines), use `usePaginatedQuery` against paginated backend queries:

```tsx
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function WorkoutHistory() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.workouts.getWorkouts,
    {},
    { initialNumItems: 10 }
  );

  return (
    <div>
      {results.map((workout) => (
        <div key={workout._id}>{workout.date}</div>
      ))}
      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(10)}>Load More</button>
      )}
    </div>
  );
}
```

Trainers viewing a client's data pass `targetUserId` as an additional query arg.

---

## Proactive Auditing & Monitoring

Use the **Health & Insights** panel in the Convex Deployment Dashboard for real-time analysis of function performance and read patterns.

For local sampling, `scripts/auditLimits.ts` scans table row counts and estimated sizes. It calls the `internalQuery` `audit.getTableChunk` via `npx convex run` under the hood, so it needs the Convex CLI authenticated against the target deployment (the same credentials `npx convex dev`/`deploy` use) rather than any URL or key in `.env.local`:

```bash
npx tsx scripts/auditLimits.ts
# or against prod:
npx tsx scripts/auditLimits.ts --prod
```

> [!NOTE]
> If a table reports `> 10,000 rows`, search the codebase for `.collect()` references against that table and upgrade them to use `.paginate()` immediately.
