import type { Request, Response, NextFunction } from 'express';
import { workoutService } from '../services/workoutService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const getWorkouts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workouts = await workoutService.getAll();
        sendSuccess(res, workouts);
    } catch (error) {
        next(error);
    }
};

export const createWorkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, notes, exercises, time, duration } = req.body;
        if (!date) return sendError(res, 'Date is required', 400);

        const result = await workoutService.create({ date, notes, exercises, time, duration });
        sendSuccess(res, { ...result, message: 'Workout created successfully' }, 201);
    } catch (error: any) {
        if (error.status === 409) return sendError(res, error.message, 409);
        next(error);
    }
};

export const getWorkoutDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workout = await workoutService.getById(req.params.id as string);
        if (!workout) return sendError(res, 'Workout not found', 404);
        sendSuccess(res, workout);
    } catch (error) {
        next(error);
    }
};

export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await workoutService.delete(req.params.id as string);
        sendSuccess(res, { message: 'Workout deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateWorkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, notes, exercises, time, duration } = req.body;
        if (!date) return sendError(res, 'Date is required', 400);

        await workoutService.update(req.params.id as string, { date, notes, exercises, time, duration });
        sendSuccess(res, { message: 'Workout updated successfully' });
    } catch (error: any) {
        if (error.status === 409) return sendError(res, error.message, 409);
        next(error);
    }
};
