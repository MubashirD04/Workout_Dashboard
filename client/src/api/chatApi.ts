import { convexClient, mapIds } from './apiClient';

export const chatApi = {
    createConversation: () => convexClient.mutation("chat:createConversation" as any),
    getConversations: (paginationOpts: any = { numItems: 20, cursor: null }) => 
        convexClient.query("chat:getConversations" as any, { paginationOpts }).then(mapIds),
    getConversation: (id: string, paginationOpts: any = { numItems: 50, cursor: null }) => 
        convexClient.query("chat:getConversation" as any, { id, paginationOpts }).then(mapIds),
    deleteConversation: (id: string) => convexClient.mutation("chat:deleteConversation" as any, { id }),
    ask: (question: string, conversationId?: any) =>
        convexClient.action("chat:askQuestion" as any, { question, conversationId }).then(mapIds),
};
