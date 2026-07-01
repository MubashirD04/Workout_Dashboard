# Fitness Dashboard — brief.md

High-level project brief. For technical detail, see `context.md`.

---

## What This Is

A multi-user fitness tracking dashboard with:

- Workout, cardio, body metrics, nutrition, and progress photo logging
- Role-based access for **admins**, **trainers**, and **clients**
- Trainer portal for client management and invite-based onboarding
- Data visualisations (volume over time, heatmap, radar chart, macro breakdown)
- An AI fitness coach powered by RAG — answers questions using fitness book knowledge + the user's own data

---

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Recharts |
| Auth | **Clerk** (browser) + Convex JWT validation |
| Backend | **Convex** (Document DB + Vector Index) |
| Embeddings | **Hugging Face Inference API** (`all-MiniLM-L6-v2`) |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Hosting | Vercel (Frontend) + Convex (Backend) |

---

## Architecture Overview

- **`client/`**: React SPA using Tailwind for styling and Recharts for visualisations. Authenticates via Clerk and communicates with the backend using the Convex React SDK.
- **`convex/`**: Serverless backend handling auth, data storage, vector search, role-based access control, and background actions.
- **AI/RAG**: Uses Hugging Face to embed book knowledge and user queries, Convex for vector retrieval, and Groq for generating responses.

---

## Key Features

- **Authentication**: Clerk sign-in; first user becomes admin; others default to client.
- **Trainer Onboarding**: Trainers generate invite codes; clients claim codes at `/invite/:code` to link to their trainer.
- **Workout Logging**: Tracks exercises (nested), sets, reps, and weight.
- **Cardio Tracking**: Logs distance, duration, and type.
- **Body Metrics**: Tracks weight, height, and body measurements.
- **Nutrition**: Monitors daily calorie and macro intake.
- **Progress Photos**: Visual timeline of physical progress (client-only access).
- **Admin Panel**: Manage user roles and trainer–client assignments.
- **AI Coach**: RAG-enhanced chatbot with access to professional fitness knowledge and personal user data.

---

## Constraints & Gotchas

- **Date handling**: All dates are stored as `YYYY-MM-DD` strings. JavaScript `Date` objects should be avoided for date-only fields to prevent timezone-related off-by-one errors.
- **Duplicate workout guard**: A workout is considered a duplicate only if it shares both the exact `date` and `time`.
- **Convex Actions**: RAG logic and external API calls (Hugging Face, Groq) must run in Convex Actions, as Queries and Mutations cannot perform external HTTP requests.
- **Vector search**: Book knowledge chunks are embedded with Hugging Face's 384-dimensional model (`sentence-transformers/all-MiniLM-L6-v2`) and stored in a Convex vector index.
- **Trainer photo restriction**: Trainers can view client workouts, cardio, metrics, and nutrition but cannot access progress photos.
- **Identity security**: User profile fields are sourced from verified Clerk JWT claims, not client-supplied mutation arguments.
