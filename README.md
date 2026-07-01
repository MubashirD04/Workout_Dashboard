# Fitness Dashboard

A high-performance fitness and workout tracking application designed to help users monitor their physical progress, nutrition, and workout routines with rich data visualizations, powered by an AI fitness coach.

## Project Structure

- **`client/`**: Frontend application built with **React**, **Vite**, **Tailwind CSS**, and **Recharts**.
- **`convex/`**: Backend built with **Convex** (serverless, document database, and vector search).
- **`scripts/`**: Local utility scripts (embedding loader, limits audit).
- **`docs/`**: Project documentation (Brief, Technical Context, Convex limits guide).

## Features

- **🔐 Authentication & Roles**: Clerk-powered sign-in with three roles — **admin**, **trainer**, and **client**.
- **👥 Trainer Portal**: Trainers manage clients, generate invite codes, and view client fitness data (excluding progress photos).
- **🤖 AI Fitness Coach**: Professional AI coach using RAG (Retrieval-Augmented Generation) to provide personalized fitness advice based on your data and expert knowledge.
- **📊 Advanced Analytics**:
  - **Volume Chart**: Track total weight moved over time.
  - **Consistency Heatmap**: Visualize workout frequency.
  - **Athlete Radar**: Compare strength, endurance, and consistency metrics.
  - **Macro Donut**: Real-time breakdown of calorie and macro intake.
- **🏋️ Workout Logging**: Full exercise tracking with sets, reps, and weights.
- **🏃 Cardio Tracking**: Log distance and duration for various activities.
- **📏 Body Metrics**: Comprehensive tracking of weight and body measurements.
- **🍎 Nutrition Tracker**: Monitor daily calories and macro targets.
- **🖼️ Progress Timeline**: Visual photo journey of your transformation (client-only; trainers cannot access).

## Quick Start

### Prerequisites

- **Node.js**: v20 or higher
- **Convex Account**: Sign up at [convex.dev](https://www.convex.dev/)
- **Clerk Account**: Sign up at [clerk.com](https://clerk.com/) for authentication
- **Hugging Face API Token**: For embeddings (`all-MiniLM-L6-v2`)
- **Groq API Key**: For fast LLM inference (AI Chat)

### Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd Workout_Dashboard
   ```

2. **Install dependencies**:

   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Configure Clerk + Convex auth**:
   - Create a Clerk application and add the **Convex** integration.
   - In the Convex dashboard, set `CLERK_JWT_ISSUER_DOMAIN` to your Clerk JWT issuer domain.

4. **Set environment variables**:

   **Client** (`client/.env.local`):

   ```bash
   VITE_CONVEX_URL=<your-convex-deployment-url>
   VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   ```

   **Convex** (via CLI):

   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-jwt-issuer-domain>
   npx convex env set HF_TOKEN <your-huggingface-token>
   npx convex env set GROQ_API_KEY <your-groq-key>
   ```

5. **Load book knowledge** (optional, for AI coach RAG):

   ```bash
   # Requires book_knowledge.csv in the repo root and HF_TOKEN in .env.local
   npx tsx scripts/loadEmbeddings.ts
   ```

6. **Run the development environment**:

   ```bash
   # Tab 1: Convex backend
   npx convex dev

   # Tab 2: Frontend
   cd client
   npm run dev
   ```

   The first user to sign in is automatically assigned the **admin** role.

## Documentation

For more detailed information, please refer to:

- [Brief](docs/brief.md)
- [Technical Context](docs/context.md)
- [Convex Limits & Pagination](docs/convex_limits_and_pagination.md)
