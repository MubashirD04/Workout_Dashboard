import pool from './index.js';

const seedData = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Cleaning up existing data...');
        // Order matters due to foreign keys
        await client.query('TRUNCATE TABLE workout_exercises RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE workouts RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE cardio_logs RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE body_metrics RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE nutrition_logs RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE progress_photos RESTART IDENTITY CASCADE');

        console.log('Seeding Workouts...');
        const workoutDates = ['2023-10-01', '2023-10-03', '2023-10-05', '2023-10-08'];
        const workoutIds = [];

        for (const date of workoutDates) {
            const res = await client.query(
                "INSERT INTO workouts (date, notes) VALUES ($1, $2) RETURNING id",
                [date, `Workout on ${date} - feeling great!`]
            );
            workoutIds.push(res.rows[0].id);
        }

        console.log('Seeding Exercises...');
        const exercises = [
            { name: 'Squat', sets: 3, reps: 5, weight: 100 },
            { name: 'Bench Press', sets: 3, reps: 8, weight: 80 },
            { name: 'Deadlift', sets: 1, reps: 5, weight: 120 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
            { name: 'Barbell Row', sets: 3, reps: 8, weight: 70 },
        ];

        for (const id of workoutIds) {
            // Add 2-3 random exercises per workout
            const numExercises = Math.floor(Math.random() * 2) + 2;
            const shuffled = exercises.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, numExercises);

            for (const ex of selected) {
                await client.query(
                    "INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, weight) VALUES ($1, $2, $3, $4, $5)",
                    [id, ex.name, ex.sets, ex.sets, ex.weight]
                );
            }
        }

        console.log('Seeding Cardio...');
        const cardioTypes = ['Run', 'Cycle', 'Swim'];
        for (let i = 0; i < 5; i++) {
            const type = cardioTypes[Math.floor(Math.random() * cardioTypes.length)]!;
            const distance = (Math.random() * 10 + 1).toFixed(2);
            const duration = Math.floor(Math.random() * 60 + 20);
            await client.query(
                "INSERT INTO cardio_logs (date, type, distance, duration, notes) VALUES (CURRENT_DATE - (make_interval(days := $1)), $2, $3, $4, $5)",
                [i * 2, type, distance, duration, `Nice ${type.toLowerCase()} session`]
            );
        }

        console.log('Seeding Body Metrics...');
        let weight = 80;
        for (let i = 0; i < 5; i++) {
            weight -= 0.2; // simulate weight loss
            await client.query(
                "INSERT INTO body_metrics (date, weight, body_fat_perc, chest, waist, hips, bicep, thigh) VALUES (CURRENT_DATE - (make_interval(weeks := $1)), $2, $3, $4, $5, $6, $7, $8)",
                [i, weight.toFixed(1), (20 - i * 0.5).toFixed(1), 100, 85, 95, 35, 60]
            );
        }

        console.log('Seeding Nutrition...');
        for (let i = 0; i < 7; i++) {
            const calories = Math.floor(Math.random() * 500 + 2000);
            const protein = Math.floor(Math.random() * 30 + 150);
            const carbs = Math.floor(Math.random() * 50 + 200);
            const fat = Math.floor(Math.random() * 20 + 60);
            await client.query(
                "INSERT INTO nutrition_logs (date, calories, protein, carbs, fat) VALUES (CURRENT_DATE - (make_interval(days := $1)), $2, $3, $4, $5)",
                [i, calories, protein, carbs, fat]
            );
        }

        console.log('Seeding Progress Photos...');
        await client.query(
            "INSERT INTO progress_photos (date, photo_url, notes) VALUES ($1, $2, $3)",
            ['2023-09-01', 'https://via.placeholder.com/300x400?text=Start', 'Starting point']
        );
        await client.query(
            "INSERT INTO progress_photos (date, photo_url, notes) VALUES ($1, $2, $3)",
            ['2023-10-01', 'https://via.placeholder.com/300x400?text=Month+1', 'One month progress']
        );


        await client.query('COMMIT');
        console.log('Dummy data seeded successfully');
        process.exit(0);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error seeding data', e);
        process.exit(1);
    } finally {
        client.release();
    }
};

seedData();
