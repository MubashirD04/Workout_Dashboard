import { apiClient } from './apiClient';

export const chatApi = {
    createConversation: () => apiClient.post('/chat/conversations', {}),
    getConversations: () => apiClient.get('/chat/conversations'),
    getConversation: (id: number) => apiClient.get(`/chat/conversations/${id}`),
    deleteConversation: (id: number) => apiClient.delete(`/chat/conversations/${id}`),
    ask: (question: string, conversationId?: number) =>
        apiClient.post('/chat/ask', { question, conversationId }),
};
