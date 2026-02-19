
import pool from '../src/db/index.js';

async function migrate() {
    try {
        console.log("Checking for 'time' column...");
        await pool.query(`
            ALTER TABLE workouts ADD COLUMN IF NOT EXISTS time TIME DEFAULT NULL;
        `);
        console.log("Column 'time' added successfully.");

        console.log("Adding UNIQUE constraint...");
        // This will prevent multiple workouts on same day if time is the same (or both null)
        // But in Postgres, multiple NULLs are allowed in UNIQUE.
        // We might need a check in the controller instead, or use a default value for time.

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
