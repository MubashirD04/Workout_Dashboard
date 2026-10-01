# Admin Panel — Remediation Plan

> Follow-up to the Admin Panel evaluation (2026-09-13). Tracks the work left after the quick fixes landed. See `context.md` → Admin Panel for current behaviour.

## Already done

- Admin route guard: `/admin` redirects non-admins to `/` before any admin-only query mounts.
- `LogViewer` wrapped in its own `ErrorBoundary` (new optional `fallback` prop), so a log failure no longer blanks the page. 
- Mutation errors in the Admin Panel are awaited and caught. They show in a dismissible banner, and the row's buttons are disabled while a request is in flight.
- Removed the `(api as any)` casts from `AdminPanel`, `LogViewer`, and `useCurrentUser`.
- `tsc -b` build fixed (unused imports in `FloatingChat.tsx` and `convex/users.ts`).

---

## Phase 0: Deploy the backend (done on dev, 2026-09-13)

- [x] Pushed to the dev deployment (`npx convex dev --once`). `function-spec` lists `logs.js:*` and the `/clerk-users-webhook` route.
- [ ] **Prod:** run `npx convex deploy` when releasing. No prod deploy has been done from this work.
- [ ] Confirm the `prune old logs` cron in the Convex dashboard (Schedules → Cron jobs). It isn't visible via the CLI.
- [ ] In the Clerk dashboard, confirm the webhook endpoint points at `<deployment>.convex.site/clerk-users-webhook`, subscribed to `user.deleted`. Do this for dev and prod separately; each deployment has its own URL and `CLERK_WEBHOOK_SECRET`.

## Phase 1: Backend correctness (done, 2026-09-13)

- [x] **1a** `users.approveTrainerRequest`: re-checks the request is still pending (also enforced in `denyTrainerRequest`). The Admin Panel's Approve button uses it.
- [x] **1b** `applyRoleChange` helper (used by `setUserRole` + `approveTrainerRequest`):
  - Leaving `client` clears the user's own `trainerId`.
  - Becoming `client` unassigns the user's clients and deletes their unused invite codes.
  - `assignClientToTrainer` now rejects a non-trainer `trainerId`, which was pulled forward from 2a.
- [x] **1c** Deletion cascade also covers `athleteProfiles`, `aiRequestLog` (`deleteUserAiRequestsBatch`), and generated `inviteCodes` (`deleteUserInviteCodesBatch`). Clients linked to a deleted **admin** are now unassigned too, not just those linked to a deleted trainer.
- [x] **1d** `recordAudit` helper in `audit.ts` writes in the caller's transaction. It's called from `setUserRole`, `approveTrainerRequest`, `denyTrainerRequest`, `assignClientToTrainer`, and `deleteUser`.
- [x] **1e** `users.ts` expected failures throw `ConvexError`. `client/src/utils/errorUtils.ts` → `getErrorMessage(err, fallback)` is used by the Admin Panel and the trainer-request handlers in `Profile.tsx`.

**Verified:**
- Convex push succeeded, and client `tsc -b` + `vite build` passed.
- On dev, as the admin, `approveTrainerRequest` on a non-pending user rejected with `ConvexError: This trainer request is no longer pending.`
- On dev, `setUserRole` demoting the only admin rejected with `ConvexError: Cannot demote the last admin.`
- After both calls, roles were unchanged and `auditLogs` was still empty, so the rolled-back transactions left no audit rows.

**Not yet exercised (would modify dev data):** a successful approve/deny, trainer→client link cleanup, the deletion cascade, and audit rows being written on success. Test them with throwaway accounts, or add `convex-test` + vitest coverage.

**Follow-ups noticed:**
- ~~`inviteCodes.ts`, `athleteProfile.ts` still throw plain `Error`; several pages display `err.message` directly.~~ Done in Phase 3.5.
- `claimInviteCode` doesn't check the code's owner is still a trainer/admin. It's now covered by revocation on demotion, but a cheap extra check.
- `audit.AUDITABLE_TABLES` / `scripts/auditLimits.ts` don't list `athleteProfiles`, `aiRequestLog`, or `logs`.

## Phase 2: Missing Admin Panel features

### 2a. Trainer–client assignment (done, 2026-09-13)
- [x] `users.listTrainers`: admin-only, trainers + admins (admins can hold clients), `.take(200)` per role, sorted by name.
- [x] Client rows show the current trainer's name and a dropdown (No trainer + trainers/admins) → `assignClientToTrainer`.

### 2b. Delete user (done, 2026-09-13)
- [x] Delete button on each row except your own opens `DeleteUserDialog`. The confirm button stays disabled until the admin types the user's email (or name, if there's no email). Escape or clicking outside cancels, and errors show inside the dialog.
- [x] The dialog explains that it deletes the Clerk account and all user data, and can't be undone.

**Bug found in testing (fixed 2026-09-13):** after an admin unassigned a client ("No trainer"), the client still showed under the admin's "Your Clients". The assignment itself was correct: the audit log showed assign → unassign and `trainerId` was cleared. The problem was that `getMyClients` returned *all* clients for admins. It now takes `scope: "mine" | "all"` (default `"mine"`, `"all"` admin-only), and `ClientsView` gives admins a toggle. Round-trip check on dev as admin: mine/all counts went 0/1 → assign → 1/1 → unassign → 0/1. A client account calling `getMyClients` is rejected.

**Verified on dev (no writes):** `listTrainers` returned the admin with only `_id/name/email/role`; assigning a client to a non-trainer was rejected with `ConvexError: Assigned user is not a trainer.`; users and `auditLogs` were unchanged afterwards. **Not exercised:** a successful assignment or deletion, or any UI click-through; both need throwaway accounts or a browser session.

### 2c. Usability (optional)
- Search/filter users by name, email, or role. Needs a search index on `users` (`searchIndex("search_name", { searchField: "name" })`) or role filter via `by_role`.
- Split into tabs (Requests / Users / Logs) once 2a and 2b add weight to the page.
- Confirm before demoting another admin.

### 2d. Audit log viewer (done, 2026-09-13)
- [x] `audit.getRecentAuditLogs`: admin-only, paginated, optional `category` filter, resolves user names. Shown as a new **Audit Log** section in the Admin Panel (`AuditLogViewer.tsx`) with its own error boundary.
- [x] `AUDIT_ACTIONS` registry with categories. `auditLogs` gained `category` + `by_category_and_timestamp`, and `actorId` is now optional so system events can be logged.
- [x] New audit writes: `user.create` (initial role), `trainerRequest.submit`/`.cancel`, invite-code claims (`user.assignTrainer` via `inviteCode`), and Clerk-webhook deletions. Trainer-request approvals now record `from: client → to: trainer` and sit under **Role changes**.
- [x] Backfilled `category` on the 6 existing dev rows.
- [ ] **Prod:** after `npx convex deploy`, run `npx convex run --prod audit:backfillAuditCategories`. This is a no-op if prod has no pre-category rows.

**Verified on dev:**
- `getRecentAuditLogs` as admin returned all 6 rows with names resolved; the `role` filter was empty before any role change.
- A client caller was rejected (`Forbidden: admin access required.`).
- A client → trainer → client round trip via `setUserRole` produced two `role` entries with actor, target, and from/to, and left the account unchanged.

**Not exercised:** the viewer UI in a browser; `user.create`, submit/cancel, invite-claim, and webhook-deletion writes (need a new signup, a client session, or a Clerk event).

## Phase 3: App-wide type safety (done, 2026-09-13)

The `(api as any)` casts hid the undeployed/mis-called function problem from the compiler.

- [x] **3.1** Removed every `(api as any)` cast (13 files). `tsc -b` reported nothing further; no other call sites were mis-typed.
- [x] **3.2** `ClientsView` paginated-query bug, fixed earlier today.
- [x] **3.3** Other `any` types removed:
  - Chart props now declare only the fields they read, dropping a bogus `id: number`, so `WorkoutLog`/`CardioTracker` no longer cast `workouts`/`logs`.
  - Callback annotations removed in `DashboardHome`, `MacroDonutChart`, `WorkoutLog`, and `CardioTracker`.
  - `calculateWorkoutVolume` is typed.
- [x] **3.4** React lint errors fixed:
  - `useCurrentUser` swaps the ref cache for `useState` with a during-render update.
  - `DashboardLayout` closes the drawer on route change during render instead of in an effect.
  - `BodyMetrics` prefills height once. **Behaviour fix:** before, clearing the height field immediately refilled it.
  - `DashboardHome` memoizes `workouts` (exhaustive-deps warning).
- [x] **3.5** Error display: the remaining raw `err.message` displays (`WorkoutLog`, `ClaimInvite`, `FloatingChat`, `Profile` athlete save, `AthleteProfileOnboarding`) use `getErrorMessage`. The backend errors they surface are now `ConvexError`: duplicate workout, invite claim/revoke, rating range, and AI rate limit. `askQuestion` recognises the rate-limit `ConvexError` via `err.data` when logging the warn row.
- [x] Deleted the unused `client/src/hooks/useFetch.ts`, left over from the removed `client/src/api/` layer. Stale doc references to that layer were removed too.
- [x] **3.6** Checks are enforced (2026-09-13). `npm run check` (root) → `client` runs:
  - `typecheck` (`tsc -b`)
  - `typecheck:convex` (full backend typecheck with the client's TypeScript + `@types/node`, which covers `http.ts`/`crons.ts` that `tsc -b` never reached)
  - `lint` (`eslint .`)

  It runs in two places:
  - **CI:** `.github/workflows/check.yml` on pushes to `main` and on PRs (Node 22, `npm ci` at root + client).
  - **Pre-commit:** `.githooks/pre-commit`. It runs only when staged files touch `client/` or `convex/`, and is enabled per clone by the root `prepare` script (`git config core.hooksPath .githooks`) on `npm install`.

  Verified: `npm run check` passes. The hook blocked a staged probe file containing `any` (exit 1, lint error shown) and skipped a docs-only index (exit 0); both tests used a throwaway index. CI has not run yet; it runs on the first push.

**Verified:**
- Client `tsc -b` is clean, `eslint src` has 0 errors and 0 warnings (was 40+ errors), and `vite build` passes. The Convex push to dev succeeded.
- In the browser via Tab Bridge, the Admin page rendered correctly after hot reload.
- One console error, "change in the order of Hooks" in `AthleteProfileGate`, was logged at the instant `useCurrentUser` was hot-swapped (`useRef` → `useState` on a live instance). That's expected from hot reload.
- **Click-through after a full reload** (all pages, as admin, about 16:08 UTC):
  - Network capture showed every page module reloaded fresh; all 60 requests returned 200 with no failures.
  - `npx convex logs --history` showed no failed Convex calls during the click-through (its only failure was an earlier deliberate client-identity check).
  - The Photos page rendered correctly.
  - **Second pass (16:11–16:13 UTC), console verified:** the tab was re-allowed so Tab Bridge re-attached at the 16:11:32 reload, confirmed by Clerk's page-load token refresh at 16:11:37 and session activity through 16:13. Across the full click-through, the console captured **zero entries at any level**: no errors, no React warnings, and the hot-reload "change in the order of Hooks" error did not recur. `npx convex logs --history` showed no new failures, and the Overview page rendered with live data (radar, volume, macros). One limit: nothing was logged at all, so there's no positive control that capture was recording, but the attach timestamp matches the reload.

**Not exercised:** the AI rate-limit path end to end (needs 10 billed calls in 5 minutes), and a duplicate-workout or bad-invite error in the UI.

## Suggested order

| # | Item | Size | Depends on |
|---|---|---|---|
| 1 | ~~Phase 0 deploy (dev)~~ ✅. Prod deploy + dashboard checks pending | XS | — |
| 2 | ~~1a, 1b, 1e~~ ✅ | S | — |
| 3 | ~~1c, 1d~~ ✅ | S | — |
| 4 | ~~3.2 ClientsView bug~~ ✅ | XS | — |
| 5 | ~~2a assignment UI~~ ✅ | M | 1b ✅ |
| 6 | ~~2b delete UI~~ ✅ | M | 1c ✅, 1e ✅ |
| 7 | ~~Phase 3 incl. CI + pre-commit (3.6)~~ ✅ | M | — |
| 8 | 2c usability | M | 2a, 2b |

Redeploy the backend (Phase 0 steps) after every phase that touches `convex/`.
