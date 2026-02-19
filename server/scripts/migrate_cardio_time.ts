import pool from '../src/db/index.js';

async function migrate() {
    try {
        console.log("Checking for 'time' column in cardio_logs...");
        await pool.query(`
            ALTER TABLE cardio_logs ADD COLUMN IF NOT EXISTS time TIME DEFAULT NULL;
        `);
        console.log("Column 'time' added successfully to cardio_logs.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
