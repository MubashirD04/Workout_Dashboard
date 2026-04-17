import { convexClient, mapIds } from './apiClient';

export const chatApi = {
    createConversation: () => convexClient.mutation("chat:createConversation" as any),
    getConversations: () => convexClient.query("chat:getConversations" as any).then(mapIds),
    getConversation: (id: string) => convexClient.query("chat:getConversation" as any, { id }).then(mapIds),
    deleteConversation: (id: string) => convexClient.mutation("chat:deleteConversation" as any, { id }),
    ask: (question: string, conversationId?: string) =>
        convexClient.action("chat:askQuestion" as any, { question, conversationId }).then(mapIds),
};
