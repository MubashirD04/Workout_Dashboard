import type { Request, Response, NextFunction } from 'express';
import { ragService } from '../services/ragService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const conversationId = await ragService.createConversation();
        sendSuccess(res, { conversationId }, 201);
    } catch (error) {
        next(error);
    }
};

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const conversations = await ragService.getAllConversations();
        sendSuccess(res, conversations);
    } catch (error) {
        next(error);
    }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const messages = await ragService.getConversation(parseInt(String(req.params.id)));
        sendSuccess(res, messages);
    } catch (error) {
        next(error);
    }
};

export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ragService.deleteConversation(parseInt(String(req.params.id)));
        sendSuccess(res, { message: 'Conversation deleted' });
    } catch (error) {
        next(error);
    }
};

export const askQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, conversationId } = req.body;

        if (!question || typeof question !== 'string') {
            return sendError(res, 'Question is required', 400);
        }

        let convId = conversationId;
        if (!convId) {
            convId = await ragService.createConversation();
        }

        await ragService.addMessage(convId, 'user', question);
        const result = await ragService.askQuestion(question, convId);
        await ragService.addMessage(convId, 'assistant', result.answer, result.sources);

        sendSuccess(res, {
            conversationId: convId,
            answer: result.answer,
            sources: result.sources,
        });
    } catch (error: any) {
        console.error('Chat error:', error);

        if (error.message?.includes('Groq')) {
            return sendError(res, 'AI service unavailable. Check your Groq API key.', 503);
        }
        if (error.message?.includes('Ollama')) {
            return sendError(res, 'Embedding service unavailable. Ensure Ollama is running.', 503);
        }

        next(error);
    }
};
