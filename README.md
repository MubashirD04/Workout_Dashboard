# Fitness Dashboard

A high-performance fitness and workout tracking application designed to help users monitor their physical progress, nutrition, and workout routines with rich data visualizations.

## Project Structure

The project is divided into two main parts:

- **`client/`**: Frontend application built with **React**, **Vite**, **Tailwind CSS**, and **Recharts**.
- **`server/`**: Backend API built with **Node.js**, **Express**, **TypeScript**, and **PostgreSQL**.

## Features

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

- **Node.js**: v18 or higher
- **PostgreSQL**: Running instance
- **npm** or **yarn**

### Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Dashboard
    ```

2.  **Backend Setup**:
    ```bash
    cd server
    npm install
    # Create .env based on server/.env.example
    # Initialize database
    npx tsx src/db/init.ts
    npm run dev
    ```

3.  **Frontend Setup**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Development

For more details on each component, please refer to the individual README files in the `client/` and `server/` directories.
