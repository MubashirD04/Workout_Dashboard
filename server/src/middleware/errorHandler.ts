import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHandler.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    // Handle specific error types if needed (e.g., validation errors)
    if (err.name === 'ValidationError') {
        return sendError(res, err.message, 400);
    }

    sendError(res, 'Internal server error', 500);
};
