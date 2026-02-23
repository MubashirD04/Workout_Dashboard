import express from 'express';
import { createWorkout, getWorkouts, getWorkoutDetails, deleteWorkout, updateWorkout } from '../controllers/workoutController.js';
import {
    createCardioLog, getCardioLogs, deleteCardioLog, getCardioLogById, updateCardioLog,
    createBodyMetric, getBodyMetrics,
    createNutritionLog, getNutritionLogs, deleteNutritionLog,
    createPhotoLog, getPhotoLogs
} from '../controllers/trackingController.js';
import {
    createConversation, getConversations, getConversation, deleteConversation, askQuestion,
} from '../controllers/chatController.js';

const router = express.Router();

// Workout Routes
router.get('/workouts', getWorkouts);
router.post('/workouts', createWorkout);
router.get('/workouts/:id', getWorkoutDetails);
router.put('/workouts/:id', updateWorkout);
router.delete('/workouts/:id', deleteWorkout);

// Cardio Routes
router.get('/cardio', getCardioLogs);
router.post('/cardio', createCardioLog);
router.get('/cardio/:id', getCardioLogById);
router.put('/cardio/:id', updateCardioLog);
router.delete('/cardio/:id', deleteCardioLog);

// Body Metrics Routes
router.get('/metrics', getBodyMetrics);
router.post('/metrics', createBodyMetric);

// Nutrition Routes
router.get('/nutrition', getNutritionLogs);
router.post('/nutrition', createNutritionLog);
router.delete('/nutrition/:id', deleteNutritionLog);

// Photo Routes
router.get('/photos', getPhotoLogs);
router.post('/photos', createPhotoLog);

// Chat / RAG Routes
router.post('/chat/conversations', createConversation);
router.get('/chat/conversations', getConversations);
router.get('/chat/conversations/:id', getConversation);
router.delete('/chat/conversations/:id', deleteConversation);
router.post('/chat/ask', askQuestion);

export default router;
