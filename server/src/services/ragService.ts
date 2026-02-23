import pool from '../db/index.js';

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

interface Chunk {
    id: number;
    book_title: string;
    chunk_index: number;
    content: string;
    similarity: number;
}

interface FitnessContext {
    recentWorkouts: any[];
    recentCardio: any[];
    latestMetrics: any;
    summary: string;
}

export const ragService = {
    async generateEmbedding(text: string): Promise<number[]> {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
        });
        if (!response.ok) {
            throw new Error(`Ollama embedding failed: ${response.statusText}`);
        }
        const data = await response.json() as { embedding: number[] };
        return data.embedding;
    },

    async getRelevantChunks(userQuery: string, limit = 5): Promise<Chunk[]> {
        const embedding = await this.generateEmbedding(userQuery);
        const embeddingStr = `[${embedding.join(',')}]`;
        const result = await pool.query(
            `SELECT id, book_title, chunk_index, content,
              1 - (embedding <=> $1::vector) AS similarity
       FROM book_knowledge
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
            [embeddingStr, limit]
        );
        return result.rows;
    },

    async getFitnessContext(): Promise<FitnessContext> {
        const workoutsRes = await pool.query(`
      SELECT w.date, w.duration, w.notes,
             COALESCE(
               json_agg(
                 json_build_object(
                   'exercise_name', we.exercise_name,
                   'sets', we.sets,
                   'reps', we.reps,
                   'weight', we.weight
                 )
               ) FILTER (WHERE we.id IS NOT NULL), '[]'
             ) AS exercises
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id
      GROUP BY w.id, w.date, w.duration, w.notes
      ORDER BY w.date DESC
      LIMIT 5
    `);

        const cardioRes = await pool.query(`
      SELECT date, type, distance, duration, notes
      FROM cardio_logs ORDER BY date DESC LIMIT 5
    `);

        const metricsRes = await pool.query(`
      SELECT date, weight, body_fat_perc, chest, waist, hips, bicep, thigh
      FROM body_metrics ORDER BY date DESC LIMIT 1
    `);

        const recentWorkouts = workoutsRes.rows;
        const recentCardio = cardioRes.rows;
        const latestMetrics = metricsRes.rows[0] || null;

        let summary = 'User Fitness Data:\n\n';

        if (latestMetrics) {
            summary += `Latest Metrics (${latestMetrics.date}):\n`;
            summary += `- Weight: ${latestMetrics.weight}kg\n`;
            if (latestMetrics.body_fat_perc) summary += `- Body Fat: ${latestMetrics.body_fat_perc}%\n`;
            summary += '\n';
        }

        if (recentWorkouts.length > 0) {
            summary += 'Recent Workouts:\n';
            recentWorkouts.forEach((w, i) => {
                summary += `${i + 1}. ${w.date}: `;
                const exerciseNames = w.exercises.map((e: any) => e.exercise_name).join(', ');
                summary += exerciseNames || 'No exercises logged';
                if (w.duration) summary += ` (${w.duration} min)`;
                summary += '\n';
            });
            summary += '\n';
        }

        if (recentCardio.length > 0) {
            summary += 'Recent Cardio:\n';
            recentCardio.forEach((c, i) => {
                summary += `${i + 1}. ${c.date}: ${c.type} - ${c.distance}km in ${c.duration} min\n`;
            });
        }

        if (!latestMetrics && recentWorkouts.length === 0 && recentCardio.length === 0) {
            summary = 'No fitness data available yet.';
        }

        return { recentWorkouts, recentCardio, latestMetrics, summary };
    },

    async generateAnswer(
        userQuery: string,
        chunks: Chunk[],
        fitnessContext: FitnessContext,
        conversationHistory: Array<{ role: string; content: string }>
    ): Promise<string> {
        const bookContext = chunks
            .map((chunk, i) => `[Source ${i + 1}: ${chunk.book_title}]\n${chunk.content}`)
            .join('\n\n---\n\n');

        const historyContext = conversationHistory
            .slice(-4)
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const systemMessage = `You are an expert AI fitness and nutrition coach with access to professional fitness books and the user's personal fitness data.

AVAILABLE INFORMATION:

1. Book Knowledge:
${bookContext || 'No relevant book content found.'}

2. User's Fitness Data:
${fitnessContext.summary}

${historyContext ? `3. Recent Conversation:\n${historyContext}\n` : ''}
INSTRUCTIONS:
- Provide personalized advice based on the user's actual fitness data when relevant
- Reference specific workouts, exercises, or metrics from their data
- Use book knowledge to support your recommendations with evidence-based information
- Be encouraging and motivational
- Keep responses concise and actionable (2-4 paragraphs max)
- If you don't have relevant information, say so honestly`;

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY environment variable is not set');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userQuery },
                ],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.9,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API failed: ${response.statusText} - ${error}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        const firstChoice = data.choices[0];
        if (!firstChoice) throw new Error('Groq API returned no choices');
        return firstChoice.message.content;
    },

    async askQuestion(question: string, conversationId?: number) {
        let conversationHistory: Array<{ role: string; content: string }> = [];
        if (conversationId) {
            const historyRes = await pool.query(
                `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
                [conversationId]
            );
            conversationHistory = historyRes.rows;
        }

        const chunks = await this.getRelevantChunks(question, 5);
        const relevantChunks = chunks.filter(c => c.similarity > 0.4);
        const fitnessContext = await this.getFitnessContext();
        const answer = await this.generateAnswer(question, relevantChunks, fitnessContext, conversationHistory);
        const sources = [...new Set(relevantChunks.map(c => c.book_title))];

        return { answer, sources };
    },

    async createConversation(): Promise<number> {
        const result = await pool.query('INSERT INTO conversations DEFAULT VALUES RETURNING id');
        return result.rows[0].id;
    },

    async addMessage(
        conversationId: number,
        role: 'user' | 'assistant',
        content: string,
        sources?: string[]
    ) {
        await pool.query(
            `INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, $2, $3, $4)`,
            [conversationId, role, content, JSON.stringify(sources || [])]
        );
        await pool.query(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [conversationId]
        );
    },

    async getConversation(conversationId: number) {
        const result = await pool.query(
            `SELECT id, role, content, sources, created_at FROM messages
       WHERE conversation_id = $1 ORDER BY created_at ASC`,
            [conversationId]
        );
        return result.rows;
    },

    async getAllConversations() {
        const result = await pool.query(
            `SELECT c.id, c.created_at, c.updated_at,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at ASC LIMIT 1) AS first_message
       FROM conversations c
       ORDER BY c.updated_at DESC
       LIMIT 20`
        );
        return result.rows;
    },

    async deleteConversation(conversationId: number) {
        await pool.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    },
};
