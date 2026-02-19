import { apiClient } from './apiClient';

export const workoutApi = {
    getAll: () => apiClient.get('/workouts'),
    getById: (id: number | string) => apiClient.get(`/workouts/${id}`),
    create: (data: any) => apiClient.post('/workouts', data),
    update: (id: number | string, data: any) => apiClient.put(`/workouts/${id}`, data),
    delete: (id: number | string) => apiClient.delete(`/workouts/${id}`),
};
