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

The first user to sign in is bootstrapped as admin; subsequent sign-ups default to client until promoted or onboarded via invite code.

---

## Repository Structure

```
/
├── client/                 # React + Vite + Tailwind + Recharts frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components & charts
│   │   ├── hooks/          # React hooks (useCurrentUser, etc.)
│   │   ├── pages/          # Page components
│   │   │   ├── Admin/      # Admin panel (user/role management)
│   │   │   ├── Trainer/    # Client list and client detail views
│   │   │   └── Auth/       # Invite claim flow
│   │   ├── api/            # Legacy Convex HTTP wrappers (prefer Convex React hooks)
│   │   ├── utils/          # Frontend utility functions
│   │   ├── App.tsx         # Routes
│   │   └── main.tsx        # Clerk + Convex providers
│   ├── package.json
│   └── vite.config.ts
├── convex/                 # Convex backend (serverless)
│   ├── schema.ts           # Schema and vector index definitions
│   ├── lib/auth.ts         # Shared auth & authorization helpers
│   ├── auth.config.ts      # Clerk JWT provider config
│   ├── users.ts            # User upsert, roles, client assignment
│   ├── inviteCodes.ts      # Trainer invite code generation & claiming
│   ├── workouts.ts         # Workout queries and mutations
│   ├── cardioLogs.ts       # Cardio queries and mutations
│   ├── bodyMetrics.ts      # Metrics queries and mutations
│   ├── nutritionLogs.ts    # Nutrition queries and mutations
│   ├── progressPhotos.ts   # Progress photo management
│   ├── chat.ts             # RAG logic (actions, conversations)
│   └── audit.ts            # Internal audit log writes
├── scripts/
│   ├── loadEmbeddings.ts   # CSV → Hugging Face embed → Convex bookKnowledge
│   └── auditLimits.ts      # Local table size sampling script
├── docs/
│   ├── brief.md
│   ├── context.md
│   ├── convex_limits_and_pagination.md
│   ├── audit_report.md
│   └── ui_redesign_guide.md
├── package.json            # Root dependencies (Convex, Clerk, HF inference)
└── README.md
```

## Known Frontend Gaps

- **Dashboard Charts & Metrics**: `DashboardHome.tsx` integrates both live database values and clean mock fallbacks:
  - Weekly Volume and the `VolumeLineChart` and `ConsistencyHeatmap` run off live data queried via `usePaginatedQuery(api.workouts.getWorkouts)`. They fall back to dummy data only if the user's database is empty.
  - The `AthleteRadarChart` and individual stat cards (e.g. Heart Rate, One Rep Max, Sleep Quality, Body Fat) still render static visual placeholders.
  - `MacroDonutChart` is fully powered by live database logs via `usePaginatedQuery(api.nutritionLogs.getNutritionLogs)`.
- Trainer client-detail view (`ClientsView` → `ClientDetail`) never renders Progress Photos, matching the access rule in `convex/lib/auth.ts`.
---

## Current Architecture

### Frontend (`client/`)

- **Framework:** React 19 with Vite
- **Auth:** Clerk (`ClerkProvider`) wired to Convex via `ConvexProviderWithClerk`
- **Data Fetching:** Convex React SDK (`useQuery`, `useMutation`, `useAction`, `usePaginatedQuery`)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 (theme tokens in `src/index.css` via `@theme`)
- **Charts:** Recharts
- **Key views:** Dashboard Home, Workout Log, Cardio Tracker, Body Metrics, Nutrition Tracker, Progress Photos, AI Chat, Admin Panel, Trainer Clients/Client Detail, Invite Claim

### Backend (`convex/`)

- **Runtime:** Convex Serverless Runtime
- **Database:** Convex Document DB
- **Auth:** Clerk JWT validated via `auth.config.ts`; identity resolved to `users` table
- **Vector Search:** Convex built-in vector index (`by_embedding`)
- **Embeddings:** Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2`)
- **LLM Inference:** Groq API (`llama-3.3-70b-versatile`)

### Authentication Flow

1. User signs in via Clerk in the browser.
2. `UserSync` component calls `users.upsertCurrentUser` on sign-in to create/update the Convex user record.
3. All protected Convex functions call `getAuthenticatedUser()` from `convex/lib/auth.ts`.
4. Role and ownership checks use `assertCanReadUserData` / `assertCanWriteUserData`.
5. **Route gating**: `App.tsx` wraps all routes in Clerk's `<SignedIn>` / `<SignedOut>` (`<RedirectToSignIn />` on sign-out). This is required, not optional — without it, protected pages mount and fire Convex queries before Clerk has resolved a session, and every `getAuthenticatedUser()` call in `convex/lib/auth.ts` throws `"Unauthenticated: no identity found."` Individual list-page queries also pass `isAuthenticated ? args : "skip"` (via `useConvexAuth()`) as defense-in-depth against the same race on fast reloads/HMR.

### Database Schema (Convex)

| Table | Key Fields | Notes |
|---|---|---|
| `users` | `tokenIdentifier`, `clerkId`, `name`, `email`, `role`, `trainerId?` | Roles: admin, trainer, client |
| `inviteCodes` | `code`, `trainerId`, `usedBy?`, `expiresAt` | 7-day expiry; trainers rate-limited to 10 active codes |
| `workouts` | `userId`, `date`, `notes?`, `time?`, `duration?`, `exercises[]` | Nested exercise objects |
| `cardioLogs` | `userId`, `date`, `type`, `distance?`, `duration?`, `notes?`, `time?` | — |
| `bodyMetrics` | `userId`, `date`, `weight?`, `height?`, `body_fat_perc?`, measurements | — |
| `nutritionLogs` | `userId`, `date`, `calories?`, `protein?`, `carbs?`, `fat?` | — |
| `progressPhotos` | `userId`, `date`, `photo_url`, `notes?` | Not accessible to trainers |
| `conversations` | `userId`, `created_at`, `updated_at` | Per-user chat threads |
| `messages` | `conversationId`, `role`, `content`, `sources?`, `created_at` | — |
| `bookKnowledge` | `book_title`, `chunk_index`, `content`, `embedding` | 384-dim vector index |
| `auditLogs` | `actorId`, `action`, `targetId?`, `metadata?`, `timestamp` | Sensitive action logging |

All fitness data tables are scoped by `userId` and indexed with `by_user`.

---

## RAG Pipeline

1. **User Query**: Received via the `askQuestion` Convex Action.
2. **Embed Query**: Query text is sent to Hugging Face Inference API (`all-MiniLM-L6-v2`).
3. **Vector Search**: Resulting vector performs `vectorSearch` against the `bookKnowledge` table.
4. **Context Retrieval**:
   - Top matching chunks from book knowledge.
   - User's recent fitness data (workouts, metrics, etc.) via internal queries.
5. **Prompt Construction**: Merges chunks, user data, and conversation history into a system prompt.
6. **Generation**: Prompt is sent to Groq (`llama-3.3-70b-versatile`).
7. **Persistence**: Response is stored in the `messages` table via an internal mutation.

Book knowledge is loaded offline via `scripts/loadEmbeddings.ts` reading `book_knowledge.csv`.

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_CONVEX_URL` | Client | Convex deployment URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client | Clerk publishable key |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex | Clerk JWT issuer for auth validation |
| `GROQ_API_KEY` | Convex Action | LLM inference |
| `HF_TOKEN` | Convex Action / scripts | Hugging Face Inference API |

---

## Key Constraints & Standards

- **Date Handling**: String format `YYYY-MM-DD` is mandatory for all date fields. This prevents timezone shifting issues common with JavaScript Date objects.
- **Duplicate Workout Guard**: A workout is a duplicate only if it shares both the exact `date` and `time`.
- **Convex Actions**: All external API integrations (embeddings, LLM) must reside in Convex Actions.
- **Schema Safety**: All tables and fields are strictly typed in `convex/schema.ts`.
- **Authorization**: Never trust client-supplied identity fields. User name/email/clerkId come from verified JWT claims in `upsertCurrentUser`.
- **Progress Photos**: Trainers are explicitly blocked from reading client progress photos via `assertCanReadUserData(..., includePhotos: true)`.
- **Pagination**: Both frontend (`usePaginatedQuery`) and backend (`paginationOptsValidator` + `.paginate()`) are fully migrated for all main lists, including user activities (`workouts`, `cardioLogs`, `bodyMetrics`, `nutritionLogs`, `progressPhotos`) and user lists (`users.listAllUsers`, `users.getMyClients`). The only pagination gap is the legacy `client/src/api/` wrapper layer, which predates this migration and is broken against the current backend — do not use it for new work.
- **Batched Deletes**: To prevent Convex transaction execution limit errors (1-second timeouts) when deleting database relationships with potentially many records (e.g. deleting messages associated with a conversation), use self-scheduling background recursive mutations (e.g. `deleteMessagesBatch`) that process items in chunks (e.g., `.take(100)`).