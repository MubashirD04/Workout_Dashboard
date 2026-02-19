import type { Response } from 'express';

export const sendSuccess = (res: Response, data: any, status = 200) => {
    return res.status(status).json(data);
};

export const sendError = (res: Response, message: string, status = 500) => {
    return res.status(status).json({ error: message });
};
