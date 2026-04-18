# Fitness Dashboard — brief.md

High-level project brief. For technical detail, see `context.md`.

---

## What This Is

A personal fitness tracking dashboard with:
- Workout, cardio, body metrics, nutrition, and progress photo logging
- Data visualisations (volume over time, heatmap, radar chart, macro breakdown)
- An AI fitness coach powered by RAG — answers questions using fitness book knowledge + the user's own data

---

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind + Recharts |
| Backend | **Convex** (Document DB + Vector Index) |
| Embeddings | **Hugging Face Inference API** (`all-MiniLM-L6-v2`) |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Hosting | Vercel (Frontend) + Convex (Backend) |

---

## Architecture Overview

- **`client/`**: React SPA using Tailwind for styling and Recharts for visualisations. Communicates with the backend using the Convex React SDK.
- **`convex/`**: Serverless backend handling data storage, vector search, and background actions.
- **AI/RAG**: Uses Hugging Face to embed book knowledge and user queries, Convex for vector retrieval, and Groq for generating responses.

---

## Key Features

- **Workout Logging**: Tracks exercises (nested), sets, reps, and weight.
- **Cardio Tracking**: Logs distance, duration, and type.
- **Body Metrics**: Tracks weight, height, and body measurements.
- **Nutrition**: Monitors daily calorie and macro intake.
- **Progress Photos**: Visual timeline of physical progress.
- **AI Coach**: RAG-enhanced chatbot with access to professional fitness knowledge and personal user data.

---

## Constraints & Gotchas

- **Date handling**: All dates are stored as `YYYY-MM-DD` strings. JavaScript `Date` objects should be avoided for date-only fields to prevent timezone-related off-by-one errors.
- **Duplicate workout guard**: A workout is considered a duplicate only if it shares both the exact `date` and `time`.
- **Convex Actions**: RAG logic and external API calls (Gemini, Groq) must run in Convex Actions, as Queries and Mutations cannot perform external HTTP requests.
- **Vector search**: Book knowledge chunks are embedded with Hugging Face's 384-dimensional model (`sentence-transformers/all-MiniLM-L6-v2`) and stored in a Convex vector index.
