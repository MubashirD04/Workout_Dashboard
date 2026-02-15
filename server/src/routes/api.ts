import express from 'express';
import { createWorkout, getWorkouts, getWorkoutDetails, deleteWorkout } from '../controllers/workoutController.js';
import {
    createCardioLog, getCardioLogs, deleteCardioLog,
    createBodyMetric, getBodyMetrics,
    createNutritionLog, getNutritionLogs,
    createPhotoLog, getPhotoLogs
} from '../controllers/trackingController.js';

const router = express.Router();

// Workout Routes
router.get('/workouts', getWorkouts);
router.post('/workouts', createWorkout);
router.get('/workouts/:id', getWorkoutDetails);
router.delete('/workouts/:id', deleteWorkout);

// Cardio Routes
router.get('/cardio', getCardioLogs);
router.post('/cardio', createCardioLog);
router.delete('/cardio/:id', deleteCardioLog);

// Body Metrics Routes
router.get('/metrics', getBodyMetrics);
router.post('/metrics', createBodyMetric);

// Nutrition Routes
router.get('/nutrition', getNutritionLogs);
router.post('/nutrition', createNutritionLog);

// Photo Routes
router.get('/photos', getPhotoLogs);
router.post('/photos', createPhotoLog);

export default router;
