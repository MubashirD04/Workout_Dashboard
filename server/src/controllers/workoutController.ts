import type { Request, Response } from 'express';
import pool from '../db/index.js';

export const getWorkouts = async (req: Request, res: Response) => {
    try {
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
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createWorkout = async (req: Request, res: Response) => {
    const { date, notes, exercises, time, duration } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check for duplicates: Same date and same time (handling NULL as 'no specific time')
        const duplicateCheck = await client.query(
            'SELECT id FROM workouts WHERE date = $1 AND (time = $2 OR (time IS NULL AND $2 IS NULL))',
            [date, time || null]
        );

        if (duplicateCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'A workout already exists for this date and time. Please edit the existing one or choose a different time of day.'
            });
        }

        // Insert workout
        const workoutResult = await client.query(
            'INSERT INTO workouts (date, notes, time, duration) VALUES ($1, $2, $3, $4) RETURNING id',
            [date, notes, time || null, duration || null]
        );
        const workoutId = workoutResult.rows[0].id;

        // Insert exercises
        if (exercises && Array.isArray(exercises)) {
            for (const exercise of exercises) {
                await client.query(
                    'INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, weight) VALUES ($1, $2, $3, $4, $5)',
                    [workoutId, exercise.exercise_name, exercise.sets, exercise.reps, exercise.weight]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ id: workoutId, message: 'Workout created successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

export const getWorkoutDetails = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const workoutResult = await pool.query('SELECT * FROM workouts WHERE id = $1', [id]);

        if (workoutResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        const exercisesResult = await pool.query('SELECT * FROM workout_exercises WHERE workout_id = $1', [id]);

        res.json({
            ...workoutResult.rows[0],
            exercises: exercisesResult.rows
        });
    } catch (error) {
        console.error('Error fetching workout details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteWorkout = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM workouts WHERE id = $1', [id]);
        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWorkout = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date, notes, exercises, time, duration } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check for duplicates (excluding self)
        const duplicateCheck = await client.query(
            'SELECT id FROM workouts WHERE date = $1 AND (time = $2 OR (time IS NULL AND $2 IS NULL)) AND id != $3',
            [date, time || null, id]
        );

        if (duplicateCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Another workout already exists for this date and time.'
            });
        }

        // Update workout
        await client.query(
            'UPDATE workouts SET date = $1, notes = $2, time = $3, duration = $4 WHERE id = $5',
            [date, notes, time || null, duration || null, id]
        );

        // Update exercises: Delete existing and re-insert new ones
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
        res.json({ message: 'Workout updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};
