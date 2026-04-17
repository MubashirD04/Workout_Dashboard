import { convexClient, mapIds } from './apiClient';

export const cardioApi = {
    getAll: () => convexClient.query("cardioLogs:getCardioLogs" as any).then(mapIds),
    getById: (id: string | number) => convexClient.query("cardioLogs:getCardioLog" as any, { id }).then(mapIds),
    create: (data: any) => convexClient.mutation("cardioLogs:createCardioLog" as any, data).then(mapIds),
    update: (id: string | number, data: any) => convexClient.mutation("cardioLogs:updateCardioLog" as any, { id, ...data }),
    delete: (id: string | number) => convexClient.mutation("cardioLogs:deleteCardioLog" as any, { id }),
};

export const metricsApi = {
    getAll: () => convexClient.query("bodyMetrics:getBodyMetrics" as any).then(mapIds),
    create: (data: any) => convexClient.mutation("bodyMetrics:createBodyMetric" as any, data),
};

export const nutritionApi = {
    getAll: () => convexClient.query("nutritionLogs:getNutritionLogs" as any).then(mapIds),
    create: (data: any) => convexClient.mutation("nutritionLogs:createNutritionLog" as any, data),
    delete: (id: string | number) => convexClient.mutation("nutritionLogs:deleteNutritionLog" as any, { id }),
};

export const photosApi = {
    getAll: () => convexClient.query("progressPhotos:getProgressPhotos" as any).then(mapIds),
    create: (data: any) => convexClient.mutation("progressPhotos:createProgressPhoto" as any, data),
};
