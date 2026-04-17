import { convexClient, mapIds } from './apiClient';

export const workoutApi = {
    getAll: () => convexClient.query("workouts:getWorkouts" as any, {}).then(mapIds),
    getById: (id: string | number) => convexClient.query("workouts:getWorkout" as any, { id }).then(mapIds),
    create: (data: any) => convexClient.mutation("workouts:createWorkout" as any, data).then(mapIds),
    update: (id: string | number, data: any) => convexClient.mutation("workouts:updateWorkout" as any, { id, ...data }),
    delete: (id: string | number) => convexClient.mutation("workouts:deleteWorkout" as any, { id }),
};
