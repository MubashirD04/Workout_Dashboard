import React, { useState } from 'react';
import { nutritionApi } from '../api/trackingApi';
import { useFetch } from '../hooks/useFetch';
import { getCurrentDate, formatDate } from '../utils/dateUtils';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface NutritionLog {
    id: number;
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

const NutritionTracker: React.FC = () => {
    const { data, refresh: refreshLogs } = useFetch(nutritionApi.getAll);
    const logs = data || [];

    const [date, setDate] = useState(getCurrentDate());
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');

    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await nutritionApi.create({
                date,
                calories: parseInt(calories) || 0,
                protein: parseInt(protein) || 0,
                carbs: parseInt(carbs) || 0,
                fat: parseInt(fat) || 0,
            });

            refreshLogs();
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setIsExpanded(false);
            setDate(getCurrentDate());
            alert('Nutrition Logged!');
        } catch (error) {
            console.error('Error logging nutrition:', error);
            alert('Failed to log nutrition');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        try {
            await nutritionApi.delete(id);
            refreshLogs();
        } catch (error) {
            console.error('Error deleting log:', error);
            alert('Failed to delete log');
        }
    };

    return (
        <div className="space-y-6">
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
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Nutrition Tracker</h2>
                            <p className="text-slate-400 text-sm font-medium">Log your daily calorie and macro intake.</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-6 transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                        <Input
                            label="Date"
                            type="date"
                            value={date}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setDate(e.target.value)}
                            className="text-xs py-1.5 w-32 text-center"
                        />
                    </div>
                </div>

                <div
                    className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-8' : 'grid-rows-[0fr] opacity-0 mt-0'} overflow-hidden relative z-10`}
                >
                    <div className="min-h-0">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <Input
                                        label="Calories (kcal)"
                                        type="number"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                        className="text-2xl font-bold rounded-xl px-4 py-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <div className="grid grid-cols-3 gap-2 h-full">
                                        <div className="flex flex-col justify-end">
                                            <Input
                                                label="Protein (g)"
                                                type="number"
                                                value={protein}
                                                onChange={(e) => setProtein(e.target.value)}
                                                className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <Input
                                                label="Carbs (g)"
                                                type="number"
                                                value={carbs}
                                                onChange={(e) => setCarbs(e.target.value)}
                                                className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <Input
                                                label="Fat (g)"
                                                type="number"
                                                value={fat}
                                                onChange={(e) => setFat(e.target.value)}
                                                className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-6 flex gap-4 pt-4 border-t border-white/5">
                                    <Button type="button" variant="secondary" onClick={() => setIsExpanded(false)} className="flex-1 py-4">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-2 py-4" disabled={!date || !calories || !protein || !carbs || !fat}>
                                        Log Nutrition
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Calories</th>
                                <th className="px-6 py-4">Protein</th>
                                <th className="px-6 py-4">Carbs</th>
                                <th className="px-6 py-4">Fat</th>
                                <th className="pl-2 pr-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(logs as NutritionLog[]).map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                        {formatDate(log.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {log.calories} kcal
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {log.protein}g
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {log.carbs}g
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {log.fat}g
                                    </td>
                                    <td className="pl-2 pr-6 py-4 whitespace-nowrap text-sm text-right">
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="p-1 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete log"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                                        No nutrition logs yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default NutritionTracker;
