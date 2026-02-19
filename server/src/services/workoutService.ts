import pool from '../db/index.js';

export const workoutService = {
    async getAll() {
        const result = await pool.query(`
            SELECT 
                w.*, 
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', we.id,
                            'exercise_name', we.exercise_name,
                            'sets', we.sets,
                            'reps', we.reps,
                            'weight', we.weight
                        )
                    ) FILTER (WHERE we.id IS NOT NULL), 
                    '[]'
                ) as exercises
            FROM workouts w
            LEFT JOIN workout_exercises we ON w.id = we.workout_id
            GROUP BY w.id
            ORDER BY w.date DESC
        `);
        return result.rows;
    },

    async getById(id: string) {
        const workoutResult = await pool.query('SELECT * FROM workouts WHERE id = $1', [id]);
        if (workoutResult.rows.length === 0) return null;

        const exercisesResult = await pool.query('SELECT * FROM workout_exercises WHERE workout_id = $1', [id]);
        return {
            ...workoutResult.rows[0],
            exercises: exercisesResult.rows
        };
    },

    async create(data: any) {
        const { date, notes, exercises, time, duration } = data;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const duplicateCheck = await client.query(
                'SELECT id FROM workouts WHERE date = $1 AND (time = $2 OR (time IS NULL AND $2 IS NULL))',
                [date, time || null]
            );

            if (duplicateCheck.rows.length > 0) {
                throw { status: 409, message: 'A workout already exists for this date and time.' };
            }

            const workoutResult = await client.query(
                'INSERT INTO workouts (date, notes, time, duration) VALUES ($1, $2, $3, $4) RETURNING id',
                [date, notes, time || null, duration || null]
            );
            const workoutId = workoutResult.rows[0].id;

            if (exercises && Array.isArray(exercises)) {
                for (const exercise of exercises) {
                    await client.query(
                        'INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, weight) VALUES ($1, $2, $3, $4, $5)',
                        [workoutId, exercise.exercise_name, exercise.sets, exercise.reps, exercise.weight]
                    );
                }
            }

            await client.query('COMMIT');
            return { id: workoutId };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async update(id: string, data: any) {
        const { date, notes, exercises, time, duration } = data;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const duplicateCheck = await client.query(
                'SELECT id FROM workouts WHERE date = $1 AND (time = $2 OR (time IS NULL AND $2 IS NULL)) AND id != $3',
                [date, time || null, id]
            );

            if (duplicateCheck.rows.length > 0) {
                throw { status: 409, message: 'Another workout already exists for this date and time.' };
            }

            await client.query(
                'UPDATE workouts SET date = $1, notes = $2, time = $3, duration = $4 WHERE id = $5',
                [date, notes, time || null, duration || null, id]
            );

            await client.query('DELETE FROM workout_exercises WHERE workout_id = $1', [id]);

            if (exercises && Array.isArray(exercises)) {
                for (const exercise of exercises) {
                    await client.query(
                        'INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, weight) VALUES ($1, $2, $3, $4, $5)',
                        [id, exercise.exercise_name, exercise.sets, exercise.reps, exercise.weight]
                    );
                }
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async delete(id: string) {
        await pool.query('DELETE FROM workouts WHERE id = $1', [id]);
        return true;
    }
};
