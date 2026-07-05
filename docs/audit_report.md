# Convex Limits Audit Report

**Date:** 2026-06-30  
**Tool:** `scripts/auditLimits.ts`  
**Deployment:** Connected via `VITE_CONVEX_URL` / `CONVEX_URL` from `.env.local`

---
> **Update:** Priority 2 (paginate `getWorkouts`/`getCardioLogs`/`getBodyMetrics`/`getNutritionLogs`/`getProgressPhotos`) and the `audit.getTableChunk` local/deployment drift noted in §4 have since been resolved in the codebase. The `bookKnowledge` findings in Priority 1 should still be treated as current until re-audited.

## Executive Summary

The audit ran successfully against the live Convex deployment. **One table requires attention today:** `bookKnowledge` (~5.3k RAG chunks, ~22.5 MiB total). A full-table `.collect()` on that table would exceed Convex's **16 MiB return-value limit** and fail at runtime.

All user fitness tables (`workouts`, `cardioLogs`, `bodyMetrics`, `nutritionLogs`) are **empty** in this deployment, so pagination pressure is low for now — but the codebase still uses unbounded `.collect()` on list queries while the frontend calls `usePaginatedQuery`, which is a latent scaling bug once users log data.

**Overall health:** 🟡 **Moderate** — safe at current user-data volume; RAG knowledge base needs guardrails before growth.

---

## Table Scan Results

| Table | Rows | Avg Row Size | Est. Total Size | Row Limit (32k) | Size Limit (16 MiB) | Status |
|---|---:|---:|---:|---|---|---|
| `bookKnowledge` | 5,270 | ~4,468 B | **~22.45 MiB** | ✅ 16% used | ❌ **140% of limit** | ⚠️ At risk |
| `workouts` | 0 | — | ~0 MiB | ✅ | ✅ | ✅ Healthy |
| `cardioLogs` | 0 | — | ~0 MiB | ✅ | ✅ | ✅ Healthy |
| `bodyMetrics` | 0 | — | ~0 MiB | ✅ | ✅ | ✅ Healthy |
| `nutritionLogs` | 0 | — | ~0 MiB | ✅ | ✅ | ✅ Healthy |

### Thresholds Applied (from `auditLimits.ts`)

| Check | Threshold | Triggered |
|---|---|---|
| Row count warning | > 10,000 | None |
| Total size warning | > 8 MiB (50% of 16 MiB) | `bookKnowledge` |
| Health pass | ≤ 10k rows AND ≤ 8 MiB | All fitness tables |

---

## Detailed Findings

### 1. `bookKnowledge` — Primary Risk

- **5,270 embedded chunks** loaded for RAG (~4.5 KB each, mostly embedding vectors + text).
- Estimated full-table payload (**~22.45 MiB**) exceeds the **16 MiB return limit**. Any query that `.collect()`s the entire table will fail.
- Row count (5,270) is still well below the **32,000 document scan** limit (~16%), so indexed/paginated reads remain viable.
- **Vector search is safe:** `askQuestion` uses `ctx.vectorSearch(..., { limit: 5 })` — bounded and appropriate.
- **`clearChunks` is batch-limited:** Deletes only 100 rows per call; clearing all ~5,270 chunks requires ~53 sequential admin invocations.

### 2. Fitness Data Tables — Empty but Unprepared

All audited fitness tables have **zero rows**. No immediate performance impact, but:

| Backend query | Pattern | Frontend consumer |
|---|---|---|
| `workouts.getWorkouts` | `.collect()` | `usePaginatedQuery` in `WorkoutLog.tsx` |
| `cardioLogs.getCardioLogs` | `.collect()` | `usePaginatedQuery` in `CardioTracker.tsx` |
| `bodyMetrics.getBodyMetrics` | `.collect()` | `usePaginatedQuery` in `BodyMetrics.tsx` |
| `nutritionLogs.getNutritionLogs` | `.collect()` | `usePaginatedQuery` in `NutritionTracker.tsx` |
| `progressPhotos.getProgressPhotos` | `.collect()` | `usePaginatedQuery` in `ProgressPhotos.tsx` |

`usePaginatedQuery` requires backend queries to accept `paginationOpts` and return `.paginate()` results. The current `.collect()` handlers do not match that contract (the frontend uses `(api as any)` casts to bypass types). Once users accumulate history, list pages will either fail or silently load entire tables into memory.

### 3. Other `.collect()` Usage (Not Covered by Audit Script)

| Location | Table | Risk at Current Scale |
|---|---|---|
| `users.listAllUsers` | `users` | Low (admin-only, small user base) |
| `users.getMyClients` | `users` | Low |
| `inviteCodes.generateInviteCode` | `inviteCodes` | Low (per-trainer, max 10 active) |
| `chat.getConversation` | `messages` | Low per conversation |
| `chat.getConversationHistory` | `messages` | Low (sliced to last 4 in action) |
| `chat.deleteConversation` | `messages` | Low per conversation |

These are acceptable at current scale but should use `.take(n)` or pagination if usage grows.

### 4. Deployment vs Local Code Drift

The audit script calls `api.audit.getTableChunk`, which **exists on the deployed backend** (audit completed successfully) but is **missing from local `convex/audit.ts`**. Local generated types in `convex/_generated/api.d.ts` also omit `users`, `inviteCodes`, and other modules present in the repo.

Reconcile by running `npx convex dev` and ensuring `getTableChunk` is committed to source control.

---

## Recommendations

### Priority 1 — `bookKnowledge` (Do Now)

1. **Never `.collect()` on `bookKnowledge`.** All reads should use vector search, `.take(n)`, or cursor pagination.
2. **Replace `clearChunks`** with a self-scheduling batch delete (similar to the pattern in `docs/convex_limits_and_pagination.md`) so admins can purge/reload knowledge in one action.
3. **Monitor growth:** At ~4.5 KB/row, the table hits the 16 MiB return ceiling around **3,700 rows** if fetched in one query — current 5,270 rows already exceed that.

### Priority 2 — Fitness List Queries (Before Production Traffic)

1. Migrate `getWorkouts`, `getCardioLogs`, `getBodyMetrics`, `getNutritionLogs`, and `getProgressPhotos` to accept `paginationOpts` and return `.paginate()` results.
2. Remove `(api as any)` casts in frontend pages once types align.
3. Re-run this audit after seeding test data to validate pagination under load.

### Priority 3 — Tooling & Monitoring

1. **Commit `audit.getTableChunk`** to `convex/audit.ts` so local code matches deployment.
2. Extend the audit script to cover `users`, `messages`, `conversations`, and `progressPhotos`.
3. Use the Convex Dashboard **Health & Insights** panel for ongoing function latency and read-pattern monitoring.

---

## How to Reproduce

```bash
# From repo root — requires VITE_CONVEX_URL or CONVEX_URL in .env.local
npx tsx scripts/auditLimits.ts
```

---

## Appendix: Convex Hard Limits Reference

| Resource | Hard Limit | Current Worst Case |
|---|---|---|
| Execution time | 1 s | N/A (audit uses paginated chunks) |
| Return payload | 16 MiB | `bookKnowledge` ~22.45 MiB if fully collected |
| Documents scanned | 32,000 | `bookKnowledge` 5,270 (16%) |
| Data read/written | 16 MiB/txn | `bookKnowledge` ~22.45 MiB if fully collected |
