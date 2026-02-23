import pool from '../db/index.js';

export const trackingService = {
    // Cardio
    async createCardio(data: any) {
        const { date, type, distance, duration, notes, time } = data;
        const result = await pool.query(
            'INSERT INTO cardio_logs (date, type, distance, duration, notes, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [date, type, distance, duration, notes, time || null]
        );
        return result.rows[0];
    },

    async getCardio(id: string) {
        const result = await pool.query('SELECT * FROM cardio_logs WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async getAllCardio() {
        const result = await pool.query('SELECT * FROM cardio_logs ORDER BY date DESC');
        return result.rows;
    },

    async updateCardio(id: string, data: any) {
        const { date, type, distance, duration, notes, time } = data;
        const result = await pool.query(
            'UPDATE cardio_logs SET date = $1, type = $2, distance = $3, duration = $4, notes = $5, time = $6 WHERE id = $7 RETURNING *',
            [date, type, distance, duration, notes, time || null, id]
        );
        return result.rows[0] || null;
    },

    async deleteCardio(id: string) {
        await pool.query('DELETE FROM cardio_logs WHERE id = $1', [id]);
        return true;
    },

    // Body Metrics
    async createMetric(data: any) {
        const { date, weight, height, body_fat_perc, chest, waist, hips, bicep, thigh } = data;
        const result = await pool.query(
            'INSERT INTO body_metrics (date, weight, height, body_fat_perc, chest, waist, hips, bicep, thigh) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [date, weight, height, body_fat_perc, chest, waist, hips, bicep, thigh]
        );
        return result.rows[0];
    },

    async getAllMetrics() {
        const result = await pool.query('SELECT * FROM body_metrics ORDER BY date DESC');
        return result.rows;
    },

    // Nutrition
    async createNutrition(data: any) {
        const { date, calories, protein, carbs, fat } = data;
        const result = await pool.query(
            'INSERT INTO nutrition_logs (date, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, calories, protein, carbs, fat]
        );
        return result.rows[0];
    },

    async getAllNutrition() {
        const result = await pool.query('SELECT * FROM nutrition_logs ORDER BY date DESC');
        return result.rows;
    },

    async deleteNutrition(id: string) {
        await pool.query('DELETE FROM nutrition_logs WHERE id = $1', [id]);
        return true;
    },

    // Photos
    async createPhoto(data: any) {
        const { date, photo_url, notes } = data;
        const result = await pool.query(
            'INSERT INTO progress_photos (date, photo_url, notes) VALUES ($1, $2, $3) RETURNING *',
            [date, photo_url, notes]
        );
        return result.rows[0];
    },

    async getAllPhotos() {
        const result = await pool.query('SELECT * FROM progress_photos ORDER BY date DESC');
        return result.rows;
    }
};
