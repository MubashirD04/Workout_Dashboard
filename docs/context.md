# Fitness Dashboard — context.md

> Living technical reference for contributors and AI coding assistants.

---

## Project Overview

A full-stack fitness and workout tracking application with multi-user authentication. Users log workouts, cardio sessions, body metrics, nutrition, and progress photos. An AI-powered fitness coach answers questions using RAG (Retrieval-Augmented Generation) against a knowledge base of fitness/nutrition book excerpts, personalised with the user's own data.

The app supports three roles:

| Role | Capabilities |
|---|---|
| **admin** | Full access; manage users and roles; view all data |
| **trainer** | Manage assigned clients; generate invite codes; view client fitness data (not progress photos) |
| **client** | Log and view own fitness data |

The first user to sign in is bootstrapped as admin; subsequent sign-ups default to client until promoted or onboarded via invite code. There is no self-serve trainer signup — a client becomes a trainer only when an admin sets their role, either directly from the Admin Panel or by approving a trainer-access request the client submitted from `/profile` (see [Trainer Access Requests](#trainer-access-requests)).

---

## Repository Structure

```
/
├── client/                 # React + Vite + Tailwind + Recharts frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components & charts
│   │   ├── hooks/          # React hooks (useCurrentUser, etc.)
│   │   ├── pages/          # Page components
│   │   │   ├── Admin/      # AdminPanel (requests, roles, trainer assignment), DeleteUserDialog, LogViewer
│   │   │   ├── Trainer/    # Client list and client detail views
│   │   │   ├── Auth/       # Invite claim flow
│   │   │   ├── Onboarding/ # One-time athlete-profile setup (gated by AthleteProfileGate)
│   │   │   └── Landing.tsx # Public marketing page shown when signed out
│   │   ├── utils/          # Frontend utility functions
│   │   ├── App.tsx         # Routes
│   │   └── main.tsx        # Clerk + Convex providers
│   ├── package.json
│   └── vite.config.ts
├── convex/                 # Convex backend (serverless)
│   ├── schema.ts           # Schema and vector index definitions
│   ├── lib/auth.ts         # Shared auth & authorization helpers
│   ├── auth.config.ts      # Clerk JWT provider config
│   ├── users.ts            # User upsert, roles, trainer requests, client assignment, deletion (+ Clerk sync)
│   ├── athleteProfile.ts   # Self-rated athlete profile (radar chart data)
│   ├── logs.ts             # Operational logs: writeLog/logError, pruneLogs, admin getRecentLogs
│   ├── crons.ts            # Daily logs.pruneLogs job
│   ├── http.ts             # Clerk webhook (user.deleted → users.deleteUserByClerkId)
│   ├── inviteCodes.ts      # Trainer invite code generation & claiming
│   ├── workouts.ts         # Workout queries and mutations
│   ├── cardioLogs.ts       # Cardio queries and mutations
│   ├── bodyMetrics.ts      # Metrics queries and mutations
│   ├── nutritionLogs.ts    # Nutrition queries and mutations
│   ├── progressPhotos.ts   # Progress photo management
│   ├── chat.ts             # RAG logic (actions, conversations)
│   └── audit.ts            # Audit log: recordAudit, AUDIT_ACTIONS, admin getRecentAuditLogs; table-size sampling
├── scripts/
│   ├── loadEmbeddings.ts   # CSV → Hugging Face embed → Convex bookKnowledge
│   └── auditLimits.ts      # Local table size sampling script
├── docs/
│   ├── brief.md
│   ├── context.md
│   ├── convex_limits_and_pagination.md
│   ├── audit_report.md
│   ├── admin_panel_plan.md
│   └── ui_redesign_guide.md
├── package.json            # Root dependencies (Convex, Clerk, HF inference)
└── README.md
```

## Known Frontend Gaps

- **Dashboard Charts & Metrics**: `DashboardHome.tsx` integrates both live database values and clean mock fallbacks:
  - Weekly Volume and the `VolumeLineChart` and `ConsistencyHeatmap` run off live data queried via `usePaginatedQuery(api.workouts.getWorkouts)`. They fall back to dummy data only if the user's database is empty.
  - `AthleteRadarChart` renders the user's self-rated `athleteProfiles` row (`athleteProfile.getMyAthleteProfile`). Individual stat cards (e.g. Heart Rate, One Rep Max, Sleep Quality, Body Fat) still render static visual placeholders.
  - `MacroDonutChart` is fully powered by live database logs via `usePaginatedQuery(api.nutritionLogs.getNutritionLogs)`.
- Trainer client-detail view (`ClientsView` → `ClientDetail`) never renders Progress Photos, matching the access rule in `convex/lib/auth.ts`.
- **Typed Convex calls**: every component calls Convex through the generated `api` object with no `any` casts, so a renamed, removed, or mis-argued function fails `tsc -b` instead of failing at runtime. The client passes `tsc -b` and `eslint src` with zero errors and zero warnings; keep it that way (`@typescript-eslint/no-explicit-any` is an error). Chart components (`WorkoutMaxWeightChart`, `CardioProgressChart`) declare only the fields they read, so Convex docs pass straight in. (The casts are how `ClientsView` once shipped calling paginated `users.getMyClients` without `paginationOpts`.)
---

## Current Architecture

### Frontend (`client/`)

- **Framework:** React 19 with Vite
- **Auth:** Clerk (`ClerkProvider`) wired to Convex via `ConvexProviderWithClerk`
- **Data Fetching:** Convex React SDK (`useQuery`, `useMutation`, `useAction`, `usePaginatedQuery`)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 (theme tokens in `src/index.css` via `@theme`)
- **Charts:** Recharts
- **Key views:** Landing (signed-out), Athlete Profile Onboarding (first sign-in), Dashboard Home, Workout Log, Cardio Tracker, Body Metrics, Nutrition Tracker, Progress Photos, AI Chat, Admin Panel, Trainer Clients/Client Detail, Invite Claim, Profile

### Backend (`convex/`)

- **Runtime:** Convex Serverless Runtime
- **Database:** Convex Document DB
- **Auth:** Clerk JWT validated via `auth.config.ts`; identity resolved to `users` table
- **Vector Search:** Convex built-in vector index (`by_embedding`)
- **Embeddings:** Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2`)
- **LLM Inference:** Groq API (`openai/gpt-oss-20b`)

### Authentication Flow

1. User signs in via Clerk in the browser.
2. `UserSync` component calls `users.upsertCurrentUser` on sign-in to create/update the Convex user record.
3. All protected Convex functions call `getAuthenticatedUser()` from `convex/lib/auth.ts`.
4. Role and ownership checks use `assertCanReadUserData` / `assertCanWriteUserData`.
5. **Route gating**: `App.tsx` wraps all routes in Clerk's `<SignedIn>` / `<SignedOut>`. Signed-out visitors render `<Landing />` (a public marketing page, not a redirect) with `SignInButton`/`SignUpButton` (`mode="modal"`) as the entry points into Clerk's auth UI. Signed-in users never mount the dashboard routes until Clerk resolves a session — this is required, not optional: without it, protected pages would fire Convex queries before Clerk has a session, and every `getAuthenticatedUser()` call in `convex/lib/auth.ts` would throw `"Unauthenticated: no identity found."` Individual list-page queries also pass `isAuthenticated ? args : "skip"` (via `useConvexAuth()`) as defense-in-depth against the same race on fast reloads/HMR.
6. **Athlete profile gate**: inside `<SignedIn>`, `AthleteProfileGate` wraps `DashboardLayout`. It waits for the Convex user row (created by `UserSync`), then queries `athleteProfile.getMyAthleteProfile`; if it returns `null` the user sees `AthleteProfileOnboarding` instead of the dashboard until they save a profile (`athleteProfile.upsertMyAthleteProfile`, ratings 1–10). Ratings stay editable from `/profile`.
7. **Sign out**: available from two places — the sidebar profile popover (`DashboardLayout.tsx`) and the `/profile` page (`Profile.tsx`) — both via Clerk's `SignOutButton` (`redirectUrl="/"`, which lands back on `Landing` once `<SignedOut>` takes over).

### Trainer Access Requests

Clients can ask to become a trainer without an admin having to initiate it:

1. From `/profile`, a `client`-role user calls `users.requestTrainerAccess`, which stamps `trainerRequestedAt` on their own `users` row (rejected if they're not a `client`, or already have a pending request).
2. Admins see every pending request in a queue at the top of the Admin Panel (`users.listPendingTrainerRequests`, backed by the `by_trainer_request` index) and can **Approve** (calls the existing `users.setUserRole` with `role: "trainer"`) or **Deny** (`users.denyTrainerRequest`, clears the flag without changing the role).
3. `setUserRole` clears `trainerRequestedAt` on *any* role change, not just approval, so the flag can never point at a stale request.
4. The requester can withdraw with `users.cancelTrainerRequest` any time before it's reviewed.

`trainerRequestedAt`'s presence is the only state — there's no separate `pending`/`approved`/`denied` enum; a denial and a withdrawal look identical (the field goes back to unset), so there's no record of a past denial. That's an intentional simplicity trade-off, not an oversight — revisit it if trainer requests ever need an audit trail.

### Admin Panel

`/admin` (`pages/Admin/AdminPanel.tsx`) renders four sections, all backed by admin-only Convex functions (`requireAdmin`):

1. **Trainer requests**: `users.listPendingTrainerRequests` → Approve (`users.approveTrainerRequest`) / Deny (`users.denyTrainerRequest`). Both re-check that the request is still pending, so a stale click (the user withdrew, or another admin already acted) fails with "This trainer request is no longer pending." instead of acting.
2. **Users**: `users.listAllUsers` (paginated, 20 at a time). Each row has:
   - Make Admin / Make Trainer / Make Client buttons (`users.setUserRole`; refuses to demote the last admin).
   - On client rows, a trainer dropdown (`users.assignClientToTrainer`) populated by `users.listTrainers` (trainers + admins, capped at 200 per role).
   - A **Delete** button (hidden on your own row) that opens `DeleteUserDialog`. The admin must type the user's email (or name, if there's no email) before `users.deleteUser` runs; failures show inside the dialog.
3. **Audit log**: `AuditLogViewer.tsx` → `audit.getRecentAuditLogs` (paginated, filterable by category: role changes, trainer requests, trainer assignments, deletions). Entries render as sentences, e.g. "Alice changed Bob's role: Client → Trainer".
4. **Application logs**: `LogViewer.tsx` → `logs.getRecentLogs` (paginated, filterable by level). This shows only operational errors/warnings from the AI coach (HF/Groq failures, rate-limit hits), not admin activity.

**Route guard:** `AdminPanel` checks `useCurrentUser().isAdmin` and redirects non-admins to `/` before mounting any admin-only query (the sidebar link is also hidden).

**Role changes keep trainer links consistent** (`applyRoleChange` in `users.ts`, shared by `setUserRole` and `approveTrainerRequest`):
- Any role change clears `trainerRequestedAt`.
- Leaving `client` clears the user's own `trainerId`.
- Becoming `client` (from trainer or admin) unassigns everyone whose `trainerId` pointed at them and deletes their unused invite codes. Trainer ↔ admin keeps both, since admins can hold clients and generate codes.

`assignClientToTrainer` also rejects a `trainerId` that isn't a trainer or admin.

**Clients page (`/clients`, `ClientsView`)**:
- `users.getMyClients` takes an optional `scope`. `"mine"` (the default) returns clients whose `trainerId` is the caller, for trainers **and** admins, filtered to `role === "client"`. `"all"` returns every client and is admin-only.
- Admins get a My clients / All clients toggle; the All view shows each client's trainer (or "Unassigned").
- Before 2026-09-13 admins always got every client, so a client an admin had unassigned still appeared under "Your Clients".

**Audit trail (`auditLogs`, `convex/audit.ts`)**:
- **Registry:** every audited action is listed in `AUDIT_ACTIONS` with its category. `recordAudit(ctx, …)` writes in the caller's transaction, so a mutation that throws writes no audit row, and it stamps `category` for the `by_category_and_timestamp` index. Actions (no `ctx.db`) use `internal.audit.writeAuditLog`, which rejects unknown actions. To audit something new, add it to `AUDIT_ACTIONS` first.

| Category | Action | Written by |
|---|---|---|
| role | `user.create` (initial role) | `users.upsertCurrentUser` (first sign-in) |
| role | `user.setRole` (from → to) | `users.setUserRole` |
| role | `trainerRequest.approve` | `users.approveTrainerRequest` |
| trainerRequest | `trainerRequest.submit` / `.cancel` | `users.requestTrainerAccess` / `cancelTrainerRequest` (actor = the client) |
| trainerRequest | `trainerRequest.deny` | `users.denyTrainerRequest` |
| assignment | `user.assignTrainer` (from → to) | `users.assignClientToTrainer`; `inviteCodes.claimInviteCode` (`via: "inviteCode"`, actor = the client) |
| deletion | `user.delete` | `users.deleteUser`; `users.deleteUserByClerkId` (`via: "clerkWebhook"`, no `actorId`) |

- **Names:** user-targeted entries store `metadata.targetName` at write time. `getRecentAuditLogs` resolves current names for the actor, target, and assignment from/to ids, and the viewer falls back to the snapshot for deleted users.
- **Coverage gaps:** there's no history before 2026-09-13, and existing accounts have no `user.create` entry. Rows written before `category` existed were backfilled with `npx convex run audit:backfillAuditCategories`; run that once on prod after deploying.
- **Retention:** `auditLogs` is never pruned.

**Error handling:**
- Expected failures in `users.ts` throw `ConvexError("…")`, not `Error`. Convex replaces plain `Error` messages with "Server Error" on production deployments, but a `ConvexError`'s message survives to the client in `err.data`.
- On the client, use `getErrorMessage(err, fallback)` (`client/src/utils/errorUtils.ts`). It returns the `ConvexError` message, or the fallback for unexpected errors.
- In the Admin Panel, failures show in a dismissible banner, and a row's buttons are disabled while a request is in flight.
- `LogViewer` sits in its own `ErrorBoundary` (via the optional `fallback` prop), so a log-query failure shows an inline notice and leaves user management working.
- `ConvexError` is used for user-facing failures across `users.ts`, `inviteCodes.ts` (code limit, revoke, claim), `workouts.ts` (duplicate date/time), `athleteProfile.ts` (rating range), and `chat.ts` (AI rate limit). Every client error display goes through `getErrorMessage`. Authorization guards in `lib/auth.ts` and "not found" checks still throw plain `Error`; these are unexpected in normal UI flows and show the caller's fallback text.

**Deployment dependency:** the log section needs `logs.ts` deployed to the Convex backend. If the frontend ships ahead of the backend, `logs:getRecentLogs` doesn't exist on the deployment and the log section shows its fallback. `http.ts` (Clerk webhook) and `crons.ts` (log pruning) are likewise inactive until pushed. After backend changes run `npx convex dev` (dev) or `npx convex deploy` (prod), and confirm with `npx convex function-spec`.

Remaining work (search/filter, tabs, confirming admin demotion) is tracked in [admin_panel_plan.md](admin_panel_plan.md).

### User Deletion & Clerk Sync

- **App → Clerk:** `users.deleteUser` (admin) runs `cascadeDeleteUser`, then schedules `users.deleteClerkUser` to remove the Clerk account (needs `CLERK_SECRET_KEY`; a 404 is treated as already deleted).
- **Clerk → App:** `http.ts` exposes `POST /clerk-users-webhook`, verifies the Svix signature with `CLERK_WEBHOOK_SECRET`, and on `user.deleted` runs `users.deleteUserByClerkId` (same cascade). Subscribe the endpoint to `user.deleted` in the Clerk dashboard.
- **Cascade:** `cascadeDeleteUser` deletes the `users` row and unassigns any clients linked to the deleted user (trainer or admin). It then schedules batched deletes for `workouts`, `cardioLogs`, `bodyMetrics`, `nutritionLogs`, `progressPhotos`, `athleteProfiles` (`deleteUserDataBatch`), `conversations` + `messages` (`deleteUserConversationsBatch`), `aiRequestLog` (`deleteUserAiRequestsBatch`), and invite codes the user generated (`deleteUserInviteCodesBatch`). `logs` rows with that `userId` are left to the 30-day prune. `inviteCodes.usedBy` on another trainer's code may still reference a deleted client.

### Database Schema (Convex)

| Table | Key Fields | Notes |
|---|---|---|
| `users` | `tokenIdentifier`, `clerkId`, `name`, `email`, `role`, `trainerId?`, `trainerRequestedAt?` | Roles: admin, trainer, client. `trainerRequestedAt` set while a client's trainer-access request awaits admin review |
| `athleteProfiles` | `userId`, `power`, `speed`, `cardio`, `endurance`, `flexibility`, `effectiveness`, `updatedAt` | One row per user, ratings 1–10; required before the dashboard renders (see `AthleteProfileGate`) |
| `inviteCodes` | `code`, `trainerId`, `usedBy?`, `expiresAt` | 7-day expiry; trainers rate-limited to 10 active codes |
| `workouts` | `userId`, `date`, `notes?`, `time?`, `duration?`, `exercises[]` | Nested exercise objects |
| `cardioLogs` | `userId`, `date`, `type`, `distance?`, `duration?`, `notes?`, `time?` | — |
| `bodyMetrics` | `userId`, `date`, `weight?`, `height?`, `body_fat_perc?`, measurements | — |
| `nutritionLogs` | `userId`, `date`, `calories?`, `protein?`, `carbs?`, `fat?` | — |
| `progressPhotos` | `userId`, `date`, `photo_url`, `notes?` | Not accessible to trainers |
| `conversations` | `userId`, `created_at`, `updated_at` | Per-user chat threads |
| `messages` | `conversationId`, `role`, `content`, `sources?`, `created_at` | — |
| `bookKnowledge` | `book_title`, `chunk_index`, `content`, `embedding` | 384-dim vector index |
| `auditLogs` | `actorId?`, `action`, `category?`, `targetId?`, `metadata?`, `timestamp` | Admin/role/assignment/deletion history (see [Admin Panel](#admin-panel)). `actorId` unset for system events. Indexed `by_timestamp` and `by_category_and_timestamp`. Never pruned |
| `aiRequestLog` | `userId`, `timestamp` | One row per `askQuestion` call, used to rate-limit the AI coach per caller |
| `logs` | `level`, `source`, `message`, `userId?`, `metadata?`, `timestamp` | Application/operational logs (errors, warnings), separate from `auditLogs`. Written via `logs.logError`/`logs.writeLog` (internal-only), pruned after 30 days by a daily cron (`logs.pruneLogs`), viewable by admins in the Admin Panel |

All fitness data tables are scoped by `userId` and indexed with `by_user`.

---

## RAG Pipeline

1. **User Query**: Received via the `askQuestion` Convex Action, which is rate-limited to 10 calls per 5 minutes per authenticated caller (`chat.recordAiRequest`, backed by the `aiRequestLog` table) before any HF/Groq calls are made.
2. **Embed Query**: Query text is sent to Hugging Face Inference API (`all-MiniLM-L6-v2`).
3. **Vector Search**: Resulting vector performs `vectorSearch` against the `bookKnowledge` table.
4. **Context Retrieval**:
   - Top matching chunks from book knowledge.
   - User's recent fitness data (workouts, metrics, etc.) via internal queries.
5. **Prompt Construction**: Merges chunks, user data, and conversation history into a system prompt.
6. **Generation**: Prompt is sent to Groq (`openai/gpt-oss-20b`).
7. **Persistence**: Response is stored in the `messages` table via an internal mutation.

Book knowledge is loaded offline via `scripts/loadEmbeddings.ts` reading `book_knowledge.csv`.

### AI Coach — Known Gaps & Scaling TODOs

- ~~**No error visibility beyond Convex's short-lived dashboard logs**~~ — resolved: the HF embedding call and Groq chat-completion call in `askQuestion` are each wrapped in try/catch and log an `error` row via `logs.logError` (source `chat.askQuestion`, with metadata on which API failed / retry attempt). Rejections from `chat.recordAiRequest`'s rate limiter log a `warn` row. See the `logs` table above; rows are viewable by admins in the Admin Panel and pruned after 30 days.
- **Response truncation**: `askQuestion` caps Groq output at `max_tokens: 1024` (`chat.ts:466`) with no truncation detection — long answers (e.g. multi-day meal plans) cut off mid-sentence with no way to continue. TODO: check `finish_reason === "length"` on the Groq response, surface a `truncated` flag to the client, and add a "Continue" affordance that replays conversation history to resume the answer (Groq's chat API has no token-level continuation/prefill, so this re-generates from context rather than resuming mid-token).
- **Rate limiting is per-user only, not global**: `chat.recordAiRequest` caps each caller at 10 calls/5min, but Groq's free tier for `openai/gpt-oss-20b` is an **org-wide** pool — 30 RPM / 1,000 RPD / 8,000 TPM / 200,000 TPD, shared across every user of the app, not per key or per user. A handful of concurrent users can exhaust the shared budget even though each stays within their own per-user cap. TODO: add a global usage counter (per-minute and per-day, across all callers) in front of the existing per-user limiter.
- **API key / billing model for scale**: a single `GROQ_API_KEY` env var currently serves every user for free — fine for beta. Before charging for usage, keep a single platform-owned key (the standard "managed key" SaaS pattern, not one key per user) with per-user usage tracked in `aiRequestLog` (or a new usage-log table) and access gated by plan tier at the app layer. Multiple keys within the *same* Groq org do not multiply the rate limit — it's enforced per-org — so if the shared quota becomes the bottleneck as usage grows, scale via a paid Groq plan or a round-robin pool across multiple Groq organizations, not per-user keys.

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_CONVEX_URL` | Client | Convex deployment URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client | Clerk publishable key |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex | Clerk JWT issuer for auth validation |
| `GROQ_API_KEY` | Convex Action | LLM inference |
| `HF_TOKEN` | Convex Action / scripts | Hugging Face Inference API |
| `CLERK_SECRET_KEY` | Convex Action (`users.deleteClerkUser`) | Deletes the Clerk account when an admin deletes a user in-app |
| `CLERK_WEBHOOK_SECRET` | Convex HTTP action (`http.ts`) | Svix signing secret for the Clerk `user.deleted` webhook |

---

## Key Constraints & Standards

- **Date Handling**: String format `YYYY-MM-DD` is mandatory for all date fields. This prevents timezone shifting issues common with JavaScript Date objects.
- **Duplicate Workout Guard**: A workout is a duplicate only if it shares both the exact `date` and `time`.
- **Convex Actions**: All external API integrations (embeddings, LLM) must reside in Convex Actions.
- **Schema Safety**: All tables and fields are strictly typed in `convex/schema.ts`.
- **Authorization**: Never trust client-supplied identity fields. User name/email/clerkId come from verified JWT claims in `upsertCurrentUser`.
- **Progress Photos**: Trainers are explicitly blocked from reading client progress photos via `assertCanReadUserData(..., includePhotos: true)`.
- **Pagination**: Both frontend (`usePaginatedQuery`) and backend (`paginationOptsValidator` + `.paginate()`) are fully migrated for all main lists, including user activities (`workouts`, `cardioLogs`, `bodyMetrics`, `nutritionLogs`, `progressPhotos`) and user lists (`users.listAllUsers`, `users.getMyClients`). The legacy `client/src/api/` wrapper layer and its `useFetch` hook have been removed; use the Convex React hooks directly.
- **Batched Deletes**: To prevent Convex transaction execution limit errors (1-second timeouts) when deleting database relationships with potentially many records (e.g. deleting messages associated with a conversation, or cascading a user deletion, see [User Deletion & Clerk Sync](#user-deletion--clerk-sync)), use self-scheduling background recursive mutations (e.g. `chat.deleteMessagesBatch`, `users.deleteUserDataBatch`, `users.deleteUserConversationsBatch`, `users.deleteUserAiRequestsBatch`) that process items in chunks (e.g., `.take(100)`).
- **Internal-only for admin/system tooling**: Functions that write or read data with no per-caller scoping — bulk table dumps (`audit.getTableChunk`), the RAG corpus writers (`chat.addChunk`/`addChunks`/`clearChunks`) — must be `internalQuery`/`internalMutation`, never a public `query`/`mutation`, since a public function is reachable by anyone with the deployment URL regardless of what auth checks run inside it. Invoke them via `npx convex run <module>:<function> '<args>'` from a script (see `scripts/auditLimits.ts`, `scripts/loadEmbeddings.ts`) — this uses real deployment credentials instead of a request-supplied secret.
- **Checks (CI + pre-commit)**: run `npm run check` from the root before pushing. It runs the client typecheck (`tsc -b`), a full Convex backend typecheck, and ESLint. GitHub Actions (`.github/workflows/check.yml`) runs the same on pushes to `main` and on PRs. `.githooks/pre-commit` runs it locally when a commit touches `client/` or `convex/`; `npm install` at the root enables the hook via `core.hooksPath`.
- **Rate limiting external-API actions**: Any Convex Action that calls a billed third-party API (Groq, Hugging Face) on a per-request basis needs a per-caller cap in front of it — see `chat.recordAiRequest`. Don't rely on auth checks alone to bound cost.