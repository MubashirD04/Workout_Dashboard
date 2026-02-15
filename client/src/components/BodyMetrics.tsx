import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface BodyMetric {
    id: number;
    date: string;
    weight: number;
    body_fat_perc: number;
    chest: number;
    waist: number;
    hips: number;
    bicep: number;
    thigh: number;
}

const BodyMetrics: React.FC = () => {
    const [metrics, setMetrics] = useState<BodyMetric[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Form State
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');
    const [bicep, setBicep] = useState('');
    const [thigh, setThigh] = useState('');

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/metrics');
            if (response.ok) {
                const data = await response.json();
                // Sort by date ascending for charts
                setMetrics(data.sort((a: BodyMetric, b: BodyMetric) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    weight: parseFloat(weight) || 0,
                    body_fat_perc: parseFloat(bodyFat) || 0,
                    chest: parseFloat(chest) || 0,
                    waist: parseFloat(waist) || 0,
                    hips: parseFloat(hips) || 0,
                    bicep: parseFloat(bicep) || 0,
                    thigh: parseFloat(thigh) || 0,
                }),
            });

            if (response.ok) {
                fetchMetrics();
                alert('Metrics logged!');
                // Optional: clear form
            } else {
                alert('Failed to log metrics');
            }
        } catch (error) {
            console.error('Error logging metrics:', error);
            alert('Error logging metrics');
        }
    };

    // Format date for chart
    const formatXAxis = (tickItem: string) => {
        return new Date(tickItem).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Body Metrics</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Track your weight, body fat %, and measurements over time.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6"><hr className="my-2" /></div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Body Fat %</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={bodyFat}
                                        onChange={(e) => setBodyFat(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6"><h4 className="text-sm font-medium text-gray-900">Measurements (cm)</h4></div>

                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Chest</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={chest}
                                        onChange={(e) => setChest(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Waist</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={waist}
                                        onChange={(e) => setWaist(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Hips</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={hips}
                                        onChange={(e) => setHips(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Bicep</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={bicep}
                                        onChange={(e) => setBicep(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Thigh</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={thigh}
                                        onChange={(e) => setThigh(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Log Metrics
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Weight History</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatXAxis} />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                            <Legend />
                            <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} name="Weight (kg)" />
                            <Line type="monotone" dataKey="body_fat_perc" stroke="#dc2626" name="Body Fat %" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Could add another chart for measurements if needed */}
        </div>
    );
};

export default BodyMetrics;
