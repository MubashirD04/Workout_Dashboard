# Fitness Dashboard — context.md

> Living technical reference for contributors and AI coding assistants.

---

## Project Overview

A full-stack fitness and workout tracking application. Users log workouts, cardio sessions, body metrics, nutrition, and progress photos. An AI-powered fitness coach answers questions using RAG (Retrieval-Augmented Generation) against a knowledge base of fitness/nutrition book excerpts, personalised with the user's own data.

---

## Repository Structure

```
/
├── client/                 # React + Vite + Tailwind + Recharts frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components & Charts
│   │   ├── hooks/          # React hooks (including Convex hooks)
│   │   ├── pages/          # Page components (Dashboard, Workout, etc.)
│   │   ├── utils/          # Frontend utility functions
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── convex/                 # Convex backend (serverless)
│   ├── scripts/            # Seed/Migration scripts
│   ├── schema.ts           # Convex schema and vector index definitions
│   ├── workouts.ts         # Workout queries and mutations
│   ├── cardioLogs.ts       # Cardio queries and mutations
│   ├── bodyMetrics.ts      # Metrics queries and mutations
│   ├── nutritionLogs.ts    # Nutrition queries and mutations
│   ├── progressPhotos.ts   # Progress photo management
│   ├── chat.ts             # RAG logic (Actions, Questions)
│   └── ...
├── docs/                   # Project documentation
│   ├── brief.md
│   └── context.md
├── package.json            # Root configuration
└── README.md
```

---

## Current Architecture

### Frontend (`client/`)
- **Framework:** React with Vite
- **Data Fetching:** Convex React SDK (`useQuery`, `useMutation`, `useAction`)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Key views:** Volume Chart, Consistency Heatmap, Athlete Radar, Macro Donut, Workout Logger, Cardio Tracker, Body Metrics, Nutrition Tracker, Progress Timeline, AI Chat

### Backend (`convex/`)
- **Runtime:** Convex Serverless Runtime
- **Database:** Convex Document DB
- **Vector Search:** Convex built-in Vector Index (`by_embedding`)
- **Embeddings:** Google Gemini Embeddings API (`text-embedding-004`)
- **LLM Inference:** Groq API (`llama-3.3-70b-versatile`)

### Database Schema (Convex)

| Table | Key Fields | Notes |
|---|---|---|
| `workouts` | `date`, `notes`, `time`, `duration`, `exercises` | `exercises` is a nested array of objects |
| `cardioLogs` | `date`, `type`, `distance`, `duration`, `notes`, `time` | — |
| `bodyMetrics` | `date`, `weight`, `height`, `body_fat_perc`, etc. | — |
| `nutritionLogs` | `date`, `calories`, `protein`, `carbs`, `fat` | — |
| `progressPhotos` | `date`, `photo_url`, `notes` | — |
| `conversations` | `created_at`, `updated_at` | — |
| `messages` | `conversationId`, `role`, `content`, `sources` | — |
| `bookKnowledge` | `book_title`, `chunk_index`, `content`, `embedding` | Vector index for search |

---

## RAG Pipeline

1. **User Query**: Received via the `askQuestion` Convex Action.
2. **Embed Query**: Query text is sent to Google Gemini Embeddings (`text-embedding-004`).
3. **Vector Search**: Resulting vector is used to perform a `vectorSearch` against the `bookKnowledge` table in Convex.
4. **Context Retrieval**:
    - Top matching chunks from book knowledge.
    - User's recent fitness data (last 5 workouts, latest metrics, etc.) via internal queries.
5. **Prompt Construction**: Merges chunks, user data, and conversation history into a system prompt.
6. **Generation**: Prompt is sent to Groq (`llama-3.3-70b-versatile`).
7. **Persistence**: Response is stored in the `messages` table via a mutation.

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_CONVEX_URL` | Client | Backend connection URL |
| `GROQ_API_KEY` | Convex Action | LLM inference |
| `GOOGLE_API_KEY` | Convex Action | Google Gemini Embeddings |

---

## Key Constraints & Standards

- **Date Handling**: String format `YYYY-MM-DD` is mandatory for all date fields. This prevents timezone shifting issues common with JavaScript Date objects.
- **Convex Actions**: All external API integrations (Embeddings, LLM) must reside in Convex Actions.
- **Schema Safety**: All tables and fields are strictly typed in `convex/schema.ts`.
