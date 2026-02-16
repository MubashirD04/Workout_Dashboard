
import pool from '../db/index.js';
import pkg from 'pg';
const { types } = pkg;

// This test verifies that editing a workout doesn't cause date shifting.
async function runWorkoutEditTest() {
    console.log("--- Starting Workout Edit Date Consistency Test ---");

    try {
        const testDate = '2023-10-15';
        console.log(`1. Creating a workout with date: ${testDate}`);

        const createRes = await pool.query(
            'INSERT INTO workouts (date, notes) VALUES ($1, $2) RETURNING id',
            [testDate, 'Initial workout']
        );
        const workoutId = createRes.rows[0].id;

        // Fetch to see what we got
        const firstFetch = await pool.query('SELECT date FROM workouts WHERE id = $1', [workoutId]);
        const dateAfterCreate = firstFetch.rows[0].date;
        console.log(`   Date in DB after creation: ${dateAfterCreate} (${typeof dateAfterCreate})`);

        if (dateAfterCreate !== testDate) {
            throw new Error(`Date mismatch after creation! Expected ${testDate}, got ${dateAfterCreate}`);
        }

        console.log(`2. Updating the workout notes (simulating an edit)...`);
        await pool.query(
            'UPDATE workouts SET notes = $1 WHERE id = $2',
            ['Updated workout notes', workoutId]
        );

        // Fetch again
        const secondFetch = await pool.query('SELECT date FROM workouts WHERE id = $1', [workoutId]);
        const dateAfterUpdate = secondFetch.rows[0].date;
        console.log(`   Date in DB after update: ${dateAfterUpdate}`);

        if (dateAfterUpdate !== testDate) {
            throw new Error(`Date mismatch after update! Expected ${testDate}, got ${dateAfterUpdate}`);
        }

        console.log(`3. Updating the date itself to a new value...`);
        const newDate = '2023-10-16';
        await pool.query(
            'UPDATE workouts SET date = $1 WHERE id = $2',
            [newDate, workoutId]
        );

        const thirdFetch = await pool.query('SELECT date FROM workouts WHERE id = $1', [workoutId]);
        const dateAfterDateUpdate = thirdFetch.rows[0].date;
        console.log(`   Date in DB after deliberate date update: ${dateAfterDateUpdate}`);

        if (dateAfterDateUpdate !== newDate) {
            throw new Error(`Date mismatch after deliberate update! Expected ${newDate}, got ${dateAfterDateUpdate}`);
        }

        console.log("\n✅ SUCCESS: Workout dates remained consistent through edits.");

        // Cleanup
        await pool.query('DELETE FROM workouts WHERE id = $1', [workoutId]);
        process.exit(0);
    } catch (err: any) {
        console.error("\n❌ TEST FAILED:", err.message);
        process.exit(1);
    }
}

runWorkoutEditTest();
