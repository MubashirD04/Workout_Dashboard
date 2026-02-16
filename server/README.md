# Fitness Dashboard - Server

The backend API for the Fitness Dashboard, built with Node.js and Express.

## Tech Stack

- **Node.js**: Runtime environment.
- **Express**: Web framework.
- **TypeScript**: Typed JavaScript.
- **PostgreSQL**: Relational database.
- **tsx**: For running TypeScript in development.

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of the `server/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard
PORT=5000
```

### Database Initialization

To set up the database tables:
```bash
npx tsx src/db/init.ts
```

Optional: To seed the database with initial data:
```bash
npx tsx src/db/seed.ts
```

### Scripts

- `npm run dev`: Starts the server in development mode with hot-reloading using `tsx`.
- `npm run build`: Compiles TypeScript to JavaScript in the `dist/` folder.
- `npm start`: Runs the compiled server from the `dist/` folder.

## API Endpoints

### Workouts
- `GET /api/workouts`: Get all workouts.
- `POST /api/workouts`: Create a new workout.
- `GET /api/workouts/:id`: Get details for a specific workout.
- `PUT /api/workouts/:id`: Update an existing workout.
- `DELETE /api/workouts/:id`: Delete a workout.

### Cardio
- `GET /api/cardio`: Get all cardio logs.
- `POST /api/cardio`: Create a new cardio log.
- `DELETE /api/cardio/:id`: Delete a cardio log.

### Body Metrics
- `GET /api/metrics`: Get all body metrics.
- `POST /api/metrics`: Log new body metrics.

### Nutrition
- `GET /api/nutrition`: Get all nutrition logs.
- `POST /api/nutrition`: Create a new nutrition log.

### Progress Photos
- `GET /api/photos`: Get all progress photo logs.
- `POST /api/photos`: Upload/log a new photo.
