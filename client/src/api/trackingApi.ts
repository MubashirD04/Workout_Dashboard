import { apiClient } from './apiClient';

export const cardioApi = {
    getAll: () => apiClient.get('/cardio'),
    getById: (id: number | string) => apiClient.get(`/cardio/${id}`),
    create: (data: any) => apiClient.post('/cardio', data),
    update: (id: number | string, data: any) => apiClient.put(`/cardio/${id}`, data),
    delete: (id: number | string) => apiClient.delete(`/cardio/${id}`),
};

export const metricsApi = {
    getAll: () => apiClient.get('/metrics'),
    create: (data: any) => apiClient.post('/metrics', data),
};

export const nutritionApi = {
    getAll: () => apiClient.get('/nutrition'),
    create: (data: any) => apiClient.post('/nutrition', data),
    delete: (id: number | string) => apiClient.delete(`/nutrition/${id}`),
};

export const photosApi = {
    getAll: () => apiClient.get('/photos'),
    create: (data: any) => apiClient.post('/photos', data),
};
