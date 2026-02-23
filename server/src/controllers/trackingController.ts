import type { Request, Response, NextFunction } from 'express';
import { trackingService } from '../services/trackingService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// Cardio
export const createCardioLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, type } = req.body;
        if (!date || !type) return sendError(res, 'Date and Type are required', 400);

        const log = await trackingService.createCardio(req.body);
        sendSuccess(res, log, 201);
    } catch (error) {
        next(error);
    }
};

export const getCardioLogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const log = await trackingService.getCardio(req.params.id as string);
        if (!log) return sendError(res, 'Cardio log not found', 404);
        sendSuccess(res, log);
    } catch (error) {
        next(error);
    }
};

export const updateCardioLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, type } = req.body;
        if (!date || !type) return sendError(res, 'Date and Type are required', 400);

        const log = await trackingService.updateCardio(req.params.id as string, req.body);
        if (!log) return sendError(res, 'Cardio log not found', 404);
        sendSuccess(res, log);
    } catch (error) {
        next(error);
    }
};

export const getCardioLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logs = await trackingService.getAllCardio();
        sendSuccess(res, logs);
    } catch (error) {
        next(error);
    }
};

export const deleteCardioLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await trackingService.deleteCardio(req.params.id as string);
        sendSuccess(res, { message: 'Cardio log deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Body Metrics
export const createBodyMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metric = await trackingService.createMetric(req.body);
        sendSuccess(res, metric, 201);
    } catch (error) {
        next(error);
    }
};

export const getBodyMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await trackingService.getAllMetrics();
        sendSuccess(res, metrics);
    } catch (error) {
        next(error);
    }
};

// Nutrition
export const createNutritionLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const log = await trackingService.createNutrition(req.body);
        sendSuccess(res, log, 201);
    } catch (error) {
        next(error);
    }
};

export const getNutritionLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logs = await trackingService.getAllNutrition();
        sendSuccess(res, logs);
    } catch (error) {
        next(error);
    }
};

export const deleteNutritionLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await trackingService.deleteNutrition(req.params.id as string);
        sendSuccess(res, { message: 'Nutrition log deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Photos
export const createPhotoLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const log = await trackingService.createPhoto(req.body);
        sendSuccess(res, log, 201);
    } catch (error) {
        next(error);
    }
};

export const getPhotoLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logs = await trackingService.getAllPhotos();
        sendSuccess(res, logs);
    } catch (error) {
        next(error);
    }
};
