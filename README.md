# Fitness Dashboard

A comprehensive fitness and workout tracking application designed to help users monitor their physical progress, nutrition, and workout routines.

## Project Structure

The project is divided into two main parts:

- **`client/`**: The frontend application built with React, Vite, and Tailwind CSS.
- **`server/`**: The backend API built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Workout Logging**: Track your exercises, sets, reps, and weights.
- **Cardio Tracking**: Monitor your running, cycling, or other cardio activities.
- **Body Metrics**: Keep a record of your weight and other body measurements.
- **Nutrition Tracking**: Log your daily calorie and macro intake.
- **Progress Photos**: Visual timeline of your fitness journey.
- **Analytics**: Data visualization using Recharts to see your progress over time.

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

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
    # Setup your .env file (refer to .env.example)
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
