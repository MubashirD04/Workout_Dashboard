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
            alert('Nutrition Logged!');
        } catch (error) {
            console.error('Error logging nutrition:', error);
            alert('Failed to log nutrition');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 sm:p-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Nutrition Tracker</h3>
                        <p className="text-sm text-slate-400">
                            Log your daily calorie and macro intake.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <Input
                                        label="Date"
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6"><hr className="border-white/5 my-2" /></div>

                                <div className="col-span-6 sm:col-span-3">
                                    <Input
                                        label="Calories (kcal)"
                                        type="number"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Protein (g)"
                                        type="number"
                                        value={protein}
                                        onChange={(e) => setProtein(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Carbs (g)"
                                        type="number"
                                        value={carbs}
                                        onChange={(e) => setCarbs(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Fat (g)"
                                        type="number"
                                        value={fat}
                                        onChange={(e) => setFat(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 flex justify-end pt-4">
                                    <Button type="submit" className="px-6">
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(logs as NutritionLog[]).map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
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
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm italic">
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
