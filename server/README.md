# Fitness Dashboard - Server

The backend API for the Fitness Dashboard, built with Node.js and Express, featuring a RAG-powered AI fitness coach.

## Tech Stack

- **Node.js**: Runtime environment.
- **Express**: Web framework.
- **TypeScript**: Typed JavaScript.
- **PostgreSQL**: Relational database.
- **pgvector**: For vector similarity search in RAG.
- **Ollama**: For local text embeddings (using `nomic-embed-text`).
- **Groq**: For high-speed LLM inference (using `llama-3.3-70b-versatile`).
- **tsx**: For running TypeScript in development.

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of the `server/` directory:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dashboard
DB_PASSWORD=your_password
DB_PORT=5432
PORT=5000

# Required for AI Features
GROQ_API_KEY=your_groq_api_key
```

### External Services

1.  **PostgreSQL**: Ensure `pgvector` extension is enabled.
2.  **Ollama**: Install [Ollama](https://ollama.ai/) and pull the embedding model:
    ```bash
    ollama pull nomic-embed-text
    ollama serve
    ```

### Database Initialization

To set up the database tables (including vector columns):
```bash
npx tsx src/db/init.ts
```

Optional: To seed the database with initial workout data and RAG knowledge:
```bash
npx tsx src/db/seed.ts
# or for knowledge data specifically
npx tsx src/scripts/import_books.ts
```

### Scripts

- `npm run dev`: Starts the server in development mode.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled server.

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
- `DELETE /api/nutrition/:id`: Delete a nutrition log.

### Progress Photos
- `GET /api/photos`: Get all progress photo logs.
- `POST /api/photos`: Upload/log a new photo.

### AI Fitness Coach (RAG)
- `POST /api/chat/conversations`: Create a new chat session.
- `GET /api/chat/conversations`: Get recent conversations.
- `GET /api/chat/conversations/:id`: Get messages for a session.
- `DELETE /api/chat/conversations/:id`: Delete a session.
- `POST /api/chat/ask`: Send a question to the AI coach.
