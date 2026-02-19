export const calculateWorkoutVolume = (exercises: any[] = []) => {
    if (!exercises) return 0;
    return exercises.reduce((acc, ex) => acc + (ex.sets * ex.reps * ex.weight), 0);
};

export const calculatePace = (distance: number, duration: number) => {
    if (!distance || !duration) return "0.00";
    return (duration / distance).toFixed(2);
};
