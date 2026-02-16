import React, { useState, useEffect } from 'react';

interface NutritionLog {
    id: number;
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

const NutritionTracker: React.FC = () => {
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/nutrition');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching nutrition logs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/nutrition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    calories: parseInt(calories) || 0,
                    protein: parseInt(protein) || 0,
                    carbs: parseInt(carbs) || 0,
                    fat: parseInt(fat) || 0,
                }),
            });

            if (response.ok) {
                fetchLogs();
                setCalories('');
                setProtein('');
                setCarbs('');
                setFat('');
                alert('Nutrition Logged!');
            } else {
                alert('Failed to log nutrition');
            }
        } catch (error) {
            console.error('Error logging nutrition:', error);
            alert('Error logging nutrition');
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-2">Nutrition Tracker</h3>
                        <p className="text-sm text-slate-400">
                            Log your daily calorie and macro intake.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6"><hr className="border-white/5 my-2" /></div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Calories (kcal)</label>
                                    <input
                                        type="number"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Protein (g)</label>
                                    <input
                                        type="number"
                                        value={protein}
                                        onChange={(e) => setProtein(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Carbs (g)</label>
                                    <input
                                        type="number"
                                        value={carbs}
                                        onChange={(e) => setCarbs(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Fat (g)</label>
                                    <input
                                        type="number"
                                        value={fat}
                                        onChange={(e) => setFat(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6 flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-glow text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                                    >
                                        Log Nutrition
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Calories
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Protein
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Carbs
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Fat
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                        {new Date(log.date).toLocaleDateString()}
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NutritionTracker;
