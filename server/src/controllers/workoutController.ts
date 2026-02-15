import type { Request, Response } from 'express';
import pool from '../db/index.js';

export const getWorkouts = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM workouts ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createWorkout = async (req: Request, res: Response) => {
    const { date, notes, exercises } = req.body;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert workout
        const workoutResult = await client.query(
            'INSERT INTO workouts (date, notes) VALUES ($1, $2) RETURNING id',
            [date, notes]
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
