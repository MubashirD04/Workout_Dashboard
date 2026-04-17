# Fitness Dashboard

A high-performance fitness and workout tracking application designed to help users monitor their physical progress, nutrition, and workout routines with rich data visualizations, powered by an AI fitness coach.

## Project Structure

- **`client/`**: Frontend application built with **React**, **Vite**, **Tailwind CSS**, and **Recharts**.
- **`convex/`**: Backend built with **Convex** (serverless, document database, and vector search).
- **`docs/`**: Project documentation (Brief and Technical Context).

## Features

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
- **🖼️ Progress Timeline**: Visual photo journey of your transformation.

## Quick Start

### Prerequisites

- **Node.js**: v20 or higher
- **Convex Account**: Sign up at [convex.dev](https://www.convex.dev/)
- **Google Gemini API Key**: For embeddings (`text-embedding-004`)
- **Groq API Key**: For fast LLM inference (AI Chat)

### Setup

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd Workout_Dashboard
    ```

2.  **Environment Setup**:
    - In the root directory, run:
      ```bash
      npm install
      ```
    - Set up your Convex environment variables:
      ```bash
      npx convex env set GOOGLE_API_KEY <your-gemini-key>
      npx convex env set GROQ_API_KEY <your-groq-key>
      ```

3.  **Run Development Environment**:
    - Start the Convex dev server and the React frontend:

      ```bash
      # Tab 1: Convex backend
      npx convex dev

      # Tab 2: Frontend
      cd client
      npm install
      npm run dev
      ```

## Documentation

For more detailed information, please refer to:

- [Brief](docs/brief.md)
- [Technical Context](docs/context.md)
