import pool from './index.js';

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_name VARCHAR(255) NOT NULL,
        sets INTEGER,
        reps INTEGER,
        weight DECIMAL(5, 2)
      );

      CREATE TABLE IF NOT EXISTS cardio_logs (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        type VARCHAR(50),
        distance DECIMAL(5, 2), -- in km or miles
        duration INTEGER, -- in minutes
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS body_metrics (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        weight DECIMAL(5, 2),
        height DECIMAL(5, 2),
        body_fat_perc DECIMAL(4, 2),
        chest DECIMAL(5, 2),
        waist DECIMAL(5, 2),
        hips DECIMAL(5, 2),
        bicep DECIMAL(5, 2),
        thigh DECIMAL(5, 2)
      );

      CREATE TABLE IF NOT EXISTS nutrition_logs (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        calories INTEGER,
        protein INTEGER,
        carbs INTEGER,
        fat INTEGER
      );

      CREATE TABLE IF NOT EXISTS progress_photos (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        photo_url TEXT,
        notes TEXT
      );
    `);
    console.log('Tables created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables', err);
    process.exit(1);
  }
};

createTables();
