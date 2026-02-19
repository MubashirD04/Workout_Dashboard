import pool from '../src/db/index.js';

async function migrate() {
    try {
        console.log("Checking for 'duration' column...");
        await pool.query(`
            ALTER TABLE workouts ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT NULL;
        `);
        console.log("Column 'duration' added successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
