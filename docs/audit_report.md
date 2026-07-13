# Convex Limits Audit Report

**Date:** 2026-07-09  
**Tool:** `scripts/auditLimits.ts`  
**Deployment:** Connected via `VITE_CONVEX_URL` / `CONVEX_URL` from `.env.local`

---

## Executive Summary

The audit ran successfully against the live Convex deployment across all 11 tables. **One table requires strict caution:** `bookKnowledge` (~5.27k RAG chunks, ~45.66 MiB total). A full-table `.collect()` on `bookKnowledge` is completely impossible as it would exceed Convex's **16 MiB return-value limit** by 285% and fail at runtime.

Previously highlighted risks concerning unbounded query scans in user-activity lists and code drift have been fully resolved:
- All core user logs (`workouts`, `cardioLogs`, `bodyMetrics`, `nutritionLogs`, `progressPhotos`) are paginated via `paginationOpts` on the backend.
- Admin and trainer listing queries (`users.listAllUsers`, `users.getMyClients`) are paginated.
- Bulk message deletion on conversation purge is handled in recursive background batches (`deleteMessagesBatch` internal mutation) to prevent transaction timeouts.
- The `audit.getTableChunk` helper is committed locally in `convex/audit.ts` and aligns perfectly with the CLI script.

**Overall health:** 🟢 **Healthy / Managed** — All user-generated tables are within safe boundaries and fully prepared for scale with cursor pagination. RAG knowledge search is bounded by vector query limits.

---

## Table Scan Results

| Table | Rows | Avg Row Size | Est. Total Size | Row Limit (32k) | Size Limit (16 MiB) | Status |
|---|---:|---:|---:|---|---|---|
| `bookKnowledge` | 5,270 | ~9,086 B | **~45.66 MiB** | ✅ 16% used | ❌ **285% of limit** | ⚠️ At risk (Collected) / ✅ Safe (Vector query) |
| `users` | 2 | ~319 B | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `inviteCodes` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `workouts` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `cardioLogs` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `bodyMetrics` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `nutritionLogs` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `progressPhotos` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `conversations` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `messages` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |
| `auditLogs` | 0 | — | ~0.00 MiB | ✅ Healthy | ✅ Healthy | ✅ Healthy |

### Thresholds Applied (from `auditLimits.ts`)

| Check | Threshold | Triggered |
|---|---|---|
| Row count warning | > 10,000 | None |
| Total size warning | > 8 MiB (50% of 16 MiB) | `bookKnowledge` |
| Health pass | ≤ 10k rows AND ≤ 8 MiB | All other tables |

---

## Detailed Findings

### 1. `bookKnowledge` — Large RAG Payload
- **5,270 embedded chunks** loaded for RAG (~9 KB each, containing the embedding vector + source text metadata).
- Estimated full-table payload (**~45.66 MiB**) is nearly **3x the 16 MiB return limit**. Any query that `.collect()`s the entire table will crash.
- **Safety status:** **Fully Safe.** The RAG query `askQuestion` performs `ctx.vectorSearch(..., { limit: 8 })`, which uses the built-in index, is bounded, and reads only matching documents.
- **Batch purges:** The `clearChunks` mutation is batch-limited (100 rows per call) to avoid execution limits when reloading knowledge bases.

### 2. User Data and Fitness Logs — Scales Safe
- All fitness logs now accept `paginationOpts` and query through `.paginate()` in the backend, which correlates to `usePaginatedQuery` in the React frontend.
- `users.listAllUsers` and `users.getMyClients` are also migrated to cursor-based pagination.
- This ensures that as user data sizes grow, list views will load records incrementally and will not crash on transaction timeouts.

### 3. Bulk Deletions — Transaction Bounds Guarded
- Purging conversations (e.g. via `deleteConversation`) does not synchronously delete all associated messages. Instead, it deletes the conversation document and schedules `deleteMessagesBatch` recursively in the background.
- Each background batch deletes up to 100 messages (`.take(100)`) in a single transaction, then schedules the next batch. This guarantees zero risk of hit-limits on very long user conversations.

### 4. Auditing Access and Local Tooling
- The CLI tool `scripts/auditLimits.ts` query runs by supplying a secure `bypassKey` that matches the backend `AUDIT_BYPASS_KEY` configuration. 
- In development deployments, the backend automatically allows the query to run to facilitate local development without explicit key setups.

---

## Recommendations & Maintenance

1. **Avoid full scans on RAG tables:** Never call `.collect()` or unbounded loops on `bookKnowledge` or `messages`.
2. **Utilize `usePaginatedQuery`:** Always use paginated hooks when querying list views.
3. **Monitor growth:** Continue checking the **Health & Insights** tab in the Convex dashboard under production traffic.

---

## How to Run
```bash
# Requires VITE_CONVEX_URL in .env.local
npx tsx scripts/auditLimits.ts
```
