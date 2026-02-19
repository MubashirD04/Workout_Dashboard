import React, { useState } from 'react';
import WorkoutMaxWeightChart from '../components/WorkoutMaxWeightChart';
import { workoutApi } from '../api/workoutApi';
import { useFetch } from '../hooks/useFetch';
import { formatDate, getCurrentDate, getCurrentTime } from '../utils/dateUtils';
import { calculateWorkoutVolume } from '../utils/calculationUtils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

interface Exercise {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
}

interface Workout {
    id: number;
    date: string;
    time: string | null;
    duration: number | null;
    notes: string;
    exercises?: Exercise[];
}

const WorkoutLog: React.FC = () => {
    const { data, loading, error, refresh: refreshWorkouts } = useFetch(workoutApi.getAll);
    const workouts = data || [];
    console.log('WorkoutLog Rendering', { workoutsCount: workouts.length, loading, error });

    const [date, setDate] = useState(getCurrentDate());
    const [time, setTime] = useState(getCurrentTime());
    const [duration, setDuration] = useState<number>(60);
    const [notes, setNotes] = useState('');
    const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);

    // Exercise input state
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(10);
    const [weight, setWeight] = useState(0);

    // Edit mode and UI state
    const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const commonExercises = [
        "Squat", "Bench Press", "Deadlift", "Overhead Press",
        "Barbell Row", "Pull Up", "Dumbbell Press", "Lunges",
        "Leg Press", "Lat Pulldown", "Face Pulls", "Tricep Extensions",
        "Bicep Curls", "Lateral Raises"
    ];
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const suggestedTimes = [
        "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
    ];

    const addExercise = () => {
        if (!exerciseName || sets <= 0 || reps <= 0 || weight === 0) {
            return;
        }

        setCurrentExercises([
            ...currentExercises,
            { exercise_name: exerciseName, sets, reps, weight }
        ]);

        // Reset inputs
        setExerciseName('');
        setSets(0);
        setReps(0);
        setWeight(0);
    };

    const saveWorkout = async () => {
        try {
            const workoutData = {
                date,
                notes,
                exercises: currentExercises,
                time: time || null,
                duration: duration || null,
            };

            if (editingWorkoutId) {
                await workoutApi.update(editingWorkoutId, workoutData);
            } else {
                await workoutApi.create(workoutData);
            }

            refreshWorkouts();
            resetForm();
            alert(editingWorkoutId ? 'Workout updated!' : 'Workout saved!');
        } catch (error: any) {
            console.error('Error saving/updating workout:', error);
            alert(error.error || `Failed to ${editingWorkoutId ? 'update' : 'save'} workout`);
        }
    };

    const resetForm = () => {
        setNotes('');
        setCurrentExercises([]);
        setEditingWorkoutId(null);
        setDate(getCurrentDate());
        setTime(getCurrentTime());
        setDuration(60);
        setIsExpanded(false);
    };

    const loadWorkoutForEdit = async (workoutId: number) => {
        try {
            const data = await workoutApi.getById(workoutId);
            setEditingWorkoutId(data.id);
            setIsExpanded(true);

            const formattedDate = data.date.split('T')[0];

            setDate(formattedDate);
            setTime(data.time || '');
            setDuration(data.duration || 0);
            setNotes(data.notes || '');
            setCurrentExercises(data.exercises || []);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading workout details:', error);
        }
    };

    const handleDeleteWorkout = async (e: React.MouseEvent, workoutId: number) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this workout?')) return;

        try {
            await workoutApi.delete(workoutId);
            refreshWorkouts();
            if (editingWorkoutId === workoutId) {
                resetForm();
            }
        } catch (error) {
            console.error('Error deleting workout:', error);
            alert('Failed to delete workout');
        }
    };

    const handleIncrement = (setter: React.Dispatch<React.SetStateAction<number>>, step: number = 1) => {
        setter(prev => prev + step);
    };

    const handleDecrement = (setter: React.Dispatch<React.SetStateAction<number>>, step: number = 1) => {
        setter(prev => Math.max(0, prev - step));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: The Logger (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
                <Card className="p-6 sm:p-8">
                    <div
                        className="flex justify-between items-center cursor-pointer relative z-30"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-4 group/arrow">
                            <div className={`p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover/arrow:bg-primary group-hover/arrow:text-white shadow-glow-sm group-active/arrow:scale-90 ${isExpanded ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                                    {editingWorkoutId ? 'Edit Workout' : 'Log Workout'}
                                </h2>
                                <p className="text-slate-400 text-sm font-medium">
                                    {editingWorkoutId ? 'Modify your previous session details.' : 'Track your progress, one rep at a time.'}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-6 transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                            <Input
                                label="Workout Date"
                                type="date"
                                value={date}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setDate(e.target.value)}
                                className="text-xs py-1.5 w-32 text-center"
                            />
                            <div className="flex flex-col items-center relative z-50">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 w-full text-center">Optional Time</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        value={time}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={() => setIsTimeDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsTimeDropdownOpen(false), 200)}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none hover:border-primary/50 transition-colors w-24 uppercase text-center relative z-20"
                                    />
                                    {isTimeDropdownOpen && (
                                        <div className="absolute z-[100] w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-2xl max-h-40 overflow-y-auto custom-scrollbar">
                                            {suggestedTimes.map((t, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-3 py-1.5 hover:bg-primary hover:text-white cursor-pointer text-slate-300 text-[10px] font-bold transition-colors text-center"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTime(t);
                                                        setIsTimeDropdownOpen(false);
                                                    }}
                                                >
                                                    {t}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Input
                                label="Duration (min)"
                                type="number"
                                value={duration}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="text-xs py-1.5 w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min="0"
                            />
                        </div>
                    </div>

                    <div
                        className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-8' : 'grid-rows-[0fr] opacity-0 mt-0'} overflow-hidden relative z-10`}
                    >
                        <div className="min-h-0">
                            {/* Exercise Name Input */}
                            <div className="relative mb-8">
                                <Input
                                    label="Exercise Name"
                                    type="text"
                                    value={exerciseName}
                                    onChange={(e) => {
                                        setExerciseName(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                    placeholder="Search or type exercise..."
                                    className="text-lg px-4 py-3 placeholder:text-slate-600"
                                />
                                {isDropdownOpen && exerciseName && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        {commonExercises.filter(ex => ex.toLowerCase().includes(exerciseName.toLowerCase())).map((ex, idx) => (
                                            <div
                                                key={idx}
                                                className="px-4 py-2 hover:bg-primary/20 cursor-pointer text-slate-300 hover:text-white transition-colors"
                                                onClick={() => setExerciseName(ex)}
                                            >
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Controls: Sets, Reps, Weight */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {[
                                    { label: "Sets", value: sets, setter: setSets, step: 1 },
                                    { label: "Reps", value: reps, setter: setReps, step: 1 },
                                    { label: "Weight (kg)", value: weight, setter: setWeight, step: 2.5 }
                                ].map((control, i) => (
                                    <div key={i} className="bg-slate-900/50 rounded-xl p-4 border border-white/5 flex flex-col items-center">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">{control.label}</span>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleDecrement(control.setter, control.step)}
                                                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors text-xl font-bold active:scale-95"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={control.value || ''}
                                                onChange={(e) => control.setter(e.target.value === '' ? 0 : Number(e.target.value))}
                                                onFocus={(e) => e.target.select()}
                                                className="w-20 bg-transparent text-2xl font-bold text-white text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                step={control.step}
                                            />
                                            <button
                                                onClick={() => handleIncrement(control.setter, control.step)}
                                                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors text-xl font-bold active:scale-95"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Exercise Button */}
                            <Button
                                onClick={addExercise}
                                variant="ghost"
                                disabled={!exerciseName || sets <= 0 || reps <= 0 || weight === 0}
                                className="w-full py-3 uppercase tracking-wide text-sm flex items-center justify-center gap-2 mb-8"
                            >
                                <span>Add Exercise</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </Button>

                            {/* Current Session Review */}
                            {currentExercises.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Current Session</h3>
                                        <span className="text-xs text-slate-400">{currentExercises.length} Exercises</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {currentExercises.map((ex, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-4 flex justify-between items-center group hover:border-white/10 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white truncate">{ex.exercise_name}</p>
                                                        <p className="text-sm text-slate-400">{ex.sets} × {ex.reps} @ {ex.weight}kg</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setCurrentExercises(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-6 border-t border-white/5">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add workout notes..."
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary mb-4 resize-none h-20"
                                />
                                <div className="flex gap-4">
                                    {editingWorkoutId && (
                                        <Button
                                            onClick={resetForm}
                                            variant="secondary"
                                            className="flex-1 py-4"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    <Button
                                        onClick={saveWorkout}
                                        disabled={currentExercises.length === 0}
                                        className={`flex-[2] py-4 ${editingWorkoutId ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' : ''}`}
                                    >
                                        {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {workouts.length > 0 && <WorkoutMaxWeightChart workouts={workouts as any} />}
            </div>

            {/* Right Column: Recent History (4 cols) */}
            <div className="lg:col-span-4">
                <Card className="p-6 sm:p-8 h-full flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Recent History
                    </h3>

                    <div className="space-y-4 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
                        {(workouts as Workout[]).map((workout) => {
                            const volume = calculateWorkoutVolume(workout.exercises);

                            return (
                                <div
                                    key={workout.id}
                                    onClick={() => loadWorkoutForEdit(workout.id)}
                                    className={`bg-slate-800/50 hover:bg-slate-800 border ${editingWorkoutId === workout.id ? 'border-primary' : 'border-white/5'} hover:border-primary/30 rounded-lg p-4 transition-all w-full text-left group cursor-pointer`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-lg leading-tight">
                                                {formatDate(workout.date)}
                                            </span>
                                            {workout.time && (
                                                <span className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {workout.time.slice(0, 5)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDeleteWorkout(e, workout.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-red-400/10"
                                                title="Delete Workout"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                            <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                                                Done
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1.5" title="Total Volume">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            <span>{volume.toLocaleString()} kg</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title="Duration">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>{workout.duration || 0} min</span>
                                        </div>
                                    </div>

                                    {workout.exercises && workout.exercises.length > 0 && (
                                        <div className="border-t border-white/5 pt-3 space-y-1">
                                            {workout.exercises.map((ex: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-xs">
                                                    <span className="text-slate-300 font-medium truncate">{ex.exercise_name}</span>
                                                    <span className="text-slate-500 whitespace-nowrap ml-2">{ex.sets} × {ex.reps} @ {ex.weight}kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {workouts.length === 0 && (
                            <div className="text-center py-10 text-slate-500">
                                <p>No workouts logged yet.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default WorkoutLog;
