import React, { useState } from 'react';
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
import { metricsApi } from '../api/trackingApi';
import { useFetch } from '../hooks/useFetch';
import { getCurrentDate } from '../utils/dateUtils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

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
    const { data, refresh: refreshMetrics } = useFetch(async () => {
        const result = await metricsApi.getAll();
        return Array.isArray(result) ? result.sort((a: BodyMetric, b: BodyMetric) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
    });
    const metrics = data || [];

    const [date, setDate] = useState(getCurrentDate());

    // Form State
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');
    const [bicep, setBicep] = useState('');
    const [thigh, setThigh] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await metricsApi.create({
                date,
                weight: parseFloat(weight) || 0,
                body_fat_perc: parseFloat(bodyFat) || 0,
                chest: parseFloat(chest) || 0,
                waist: parseFloat(waist) || 0,
                hips: parseFloat(hips) || 0,
                bicep: parseFloat(bicep) || 0,
                thigh: parseFloat(thigh) || 0,
            });

            refreshMetrics();
            alert('Metrics logged!');
            // Reset form except date
            setWeight('');
            setBodyFat('');
            setChest('');
            setWaist('');
            setHips('');
            setBicep('');
            setThigh('');
        } catch (error) {
            console.error('Error logging metrics:', error);
            alert('Failed to log metrics');
        }
    };

    const formatXAxis = (tickItem: string) => {
        return new Date(tickItem).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 sm:p-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Body Metrics</h3>
                        <p className="text-sm text-slate-400">
                            Track your weight, body fat %, and measurements over time.
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
                                        label="Weight (kg)"
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <Input
                                        label="Body Fat %"
                                        type="number"
                                        step="0.1"
                                        value={bodyFat}
                                        onChange={(e) => setBodyFat(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6"><h4 className="text-sm font-bold text-white uppercase tracking-wider">Measurements (cm)</h4></div>

                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Chest"
                                        type="number"
                                        step="0.1"
                                        value={chest}
                                        onChange={(e) => setChest(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Waist"
                                        type="number"
                                        step="0.1"
                                        value={waist}
                                        onChange={(e) => setWaist(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Hips"
                                        type="number"
                                        step="0.1"
                                        value={hips}
                                        onChange={(e) => setHips(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Bicep"
                                        type="number"
                                        step="0.1"
                                        value={bicep}
                                        onChange={(e) => setBicep(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Thigh"
                                        type="number"
                                        step="0.1"
                                        value={thigh}
                                        onChange={(e) => setThigh(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button type="submit" className="px-6">
                                    Log Metrics
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Card>

            <Card className="p-6 sm:p-8">
                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">Weight History</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatXAxis}
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value) => <span className="text-slate-400 text-sm">{value}</span>}
                            />
                            <Line type="monotone" dataKey="weight" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', stroke: '#F97316', strokeWidth: 2 }} activeDot={{ r: 8 }} name="Weight (kg)" />
                            <Line type="monotone" dataKey="body_fat_perc" stroke="#334155" strokeWidth={2} name="Body Fat %" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default BodyMetrics;
