import React, { useState, useEffect } from 'react';

interface Exercise {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
}

interface Workout {
    id: number;
    date: string;
    notes: string;
    exercises?: Exercise[];
}

const WorkoutLog: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);

    // Exercise input state
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(10);
    const [weight, setWeight] = useState(0);

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const fetchWorkouts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/workouts');
            if (response.ok) {
                const data = await response.json();
                setWorkouts(data);
            }
        } catch (error) {
            console.error('Error fetching workouts:', error);
        }
    };

    const addExercise = () => {
        if (!exerciseName) return;

        setCurrentExercises([
            ...currentExercises,
            { exercise_name: exerciseName, sets, reps, weight }
        ]);

        // Reset inputs
        setExerciseName('');
        setSets(3);
        setReps(10);
        setWeight(0);
    };

    const saveWorkout = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date,
                    notes,
                    exercises: currentExercises,
                }),
            });

            if (response.ok) {
                fetchWorkouts();
                // Reset form
                setNotes('');
                setCurrentExercises([]);
                alert('Workout saved!');
            } else {
                alert('Failed to save workout');
            }
        } catch (error) {
            console.error('Error saving workout:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Log Workout</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Record your training session details.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                        <div className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>

                            <div className="col-span-6">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                    Notes
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Reflections on the workout..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Add Exercise</h4>
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Exercise Name</label>
                                    <input
                                        type="text"
                                        value={exerciseName}
                                        onChange={(e) => setExerciseName(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Sets</label>
                                    <input
                                        type="number"
                                        value={sets}
                                        onChange={(e) => setSets(parseInt(e.target.value))}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Reps</label>
                                    <input
                                        type="number"
                                        value={reps}
                                        onChange={(e) => setReps(parseInt(e.target.value))}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(parseFloat(e.target.value))}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-6">
                                    <button
                                        type="button"
                                        onClick={addExercise}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Add Exercise
                                    </button>
                                </div>
                            </div>

                            {currentExercises.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="text-sm font-medium text-gray-700">Current Session:</h5>
                                    <ul className="mt-2 divide-y divide-gray-200">
                                        {currentExercises.map((ex, idx) => (
                                            <li key={idx} className="py-2 flex justify-between">
                                                <span>{ex.exercise_name}</span>
                                                <span className="text-gray-500 text-sm">
                                                    {ex.sets} x {ex.reps} @ {ex.weight}kg
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={saveWorkout}
                                disabled={currentExercises.length === 0}
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                            >
                                Save Workout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Workouts</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {workouts.map((workout) => (
                        <li key={workout.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-blue-600 truncate">
                                    {new Date(workout.date).toLocaleDateString()}
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Completed
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                        {workout.notes || 'No notes'}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WorkoutLog;
