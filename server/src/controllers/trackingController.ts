import type { Request, Response } from 'express';
import pool from '../db/index.js';

// Cardio
export const createCardioLog = async (req: Request, res: Response) => {
    const { date, type, distance, duration, notes } = req.body;

    if (!date || !type) {
        return res.status(400).json({ error: 'Date and Type are required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO cardio_logs (date, type, distance, duration, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, type, distance, duration, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating cardio log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCardioLogs = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM cardio_logs ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching cardio logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCardioLog = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cardio_logs WHERE id = $1', [id]);
        res.json({ message: 'Cardio log deleted successfully' });
    } catch (error) {
        console.error('Error deleting cardio log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Body Metrics
export const createBodyMetric = async (req: Request, res: Response) => {
    const { date, weight, body_fat_perc, chest, waist, hips, bicep, thigh } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO body_metrics (date, weight, body_fat_perc, chest, waist, hips, bicep, thigh) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [date, weight, body_fat_perc, chest, waist, hips, bicep, thigh]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating body metric:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getBodyMetrics = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM body_metrics ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching body metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Nutrition
export const createNutritionLog = async (req: Request, res: Response) => {
    const { date, calories, protein, carbs, fat } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO nutrition_logs (date, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, calories, protein, carbs, fat]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating nutrition log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNutritionLogs = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM nutrition_logs ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching nutrition logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Photos
export const createPhotoLog = async (req: Request, res: Response) => {
    const { date, photo_url, notes } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO progress_photos (date, photo_url, notes) VALUES ($1, $2, $3) RETURNING *',
            [date, photo_url, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating photo log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPhotoLogs = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM progress_photos ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching photo logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
