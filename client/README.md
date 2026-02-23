# Fitness Dashboard - Client

The frontend application for the Fitness Dashboard, built with React and Vite.

## Tech Stack

- **React 19**: UI library.
- **TypeScript**: Typed development experience.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Utility-first styling.
- **Lucide React**: Icon library.
- **Framer Motion**: Animation library.
- **Recharts**: Data visualization.
- **React Router**: Client-side routing.

## Getting Started

### Installation

```bash
npm install
```

### Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint for code quality.
- `npm run preview`: Previews the production build locally.

## Features & Components

- **🏠 Dashboard Home**: Overview of recent activities with key statistics.
- **💪 Workout Log**: Comprehensive exercise management with set-by-set tracking.
- **🏃 Cardio Tracker**: Activity logging for runs, cycles, and more.
- **📏 Body Metrics**: Historical tracking of weight and body measurements.
- **🍎 Nutrition Tracker**: Daily log for calories and macros with visual donut chart.
- **📸 Progress Photos**: Visual diary of physical transformation.
- **🤖 AI Fitness Coach**: Floating chat interface (RAG-powered) for personalized advice.
- **📈 Data Visualizations**:
    - **VolumeLineChart**: Strength progress over time.
    - **ConsistencyHeatmap**: Active days visualization.
    - **AthleteRadarChart**: Multi-dimensional performance metrics.
    - **MacroDonutChart**: Visual macro breakdown.
    - **WorkoutMaxWeightChart**: Track 1RM progress for individual exercises.

## Configuration

The application uses Tailwind CSS for styling. Configuration can be found in `tailwind.config.js`.
The project is set up to proxy API requests to the backend server (typically on port 5000).
