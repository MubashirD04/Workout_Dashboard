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
    height: number;
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
    const [height, setHeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');
    const [bicep, setBicep] = useState('');
    const [thigh, setThigh] = useState('');

    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-populate height from latest log
    useEffect(() => {
        if (metrics.length > 0 && !height) {
            const latestHeight = metrics[metrics.length - 1].height;
            if (latestHeight) {
                setHeight(latestHeight.toString());
            }
        }
    }, [metrics, height]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await metricsApi.create({
                date,
                weight: parseFloat(weight) || 0,
                height: parseFloat(height) || 0,
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
            setHeight('');
            setBodyFat('');
            setChest('');
            setWaist('');
            setHips('');
            setBicep('');
            setThigh('');
            setIsExpanded(false);
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
                <div
                    className="flex justify-between items-center cursor-pointer relative z-30"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4 group/arrow">
                        <div className={`p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover/arrow:bg-primary group-hover/arrow:text-white shadow-glow-sm group-active/arrow:scale-90 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Body Metrics</h2>
                            <p className="text-slate-400 text-sm font-medium">Track your weight, body fat %, and measurements over time.</p>
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
                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Weight (kg)"
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="text-2xl font-bold rounded-xl px-4 py-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.0"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Height (cm)"
                                        type="number"
                                        step="0.1"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        className="text-2xl font-bold rounded-xl px-4 py-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.0"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-2">
                                    <Input
                                        label="Body Fat %"
                                        type="number"
                                        step="0.1"
                                        value={bodyFat}
                                        onChange={(e) => setBodyFat(e.target.value)}
                                        className="text-2xl font-bold rounded-xl px-4 py-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.0"
                                    />
                                </div>

                                <div className="col-span-6 mt-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center border-b border-white/5 pb-2">Measurements (cm)</h4>
                                </div>

                                <div className="col-span-6">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <Input
                                            label="Chest"
                                            type="number"
                                            step="0.1"
                                            value={chest}
                                            onChange={(e) => setChest(e.target.value)}
                                            className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.0"
                                        />
                                        <Input
                                            label="Waist"
                                            type="number"
                                            step="0.1"
                                            value={waist}
                                            onChange={(e) => setWaist(e.target.value)}
                                            className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.0"
                                        />
                                        <Input
                                            label="Hips"
                                            type="number"
                                            step="0.1"
                                            value={hips}
                                            onChange={(e) => setHips(e.target.value)}
                                            className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.0"
                                        />
                                        <Input
                                            label="Bicep"
                                            type="number"
                                            step="0.1"
                                            value={bicep}
                                            onChange={(e) => setBicep(e.target.value)}
                                            className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.0"
                                        />
                                        <Input
                                            label="Thigh"
                                            type="number"
                                            step="0.1"
                                            value={thigh}
                                            onChange={(e) => setThigh(e.target.value)}
                                            className="text-lg font-bold rounded-lg px-2 py-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-6 flex gap-4 pt-6 border-t border-white/5">
                                    <Button type="button" variant="secondary" onClick={() => setIsExpanded(false)} className="flex-1 py-4">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-2 py-4" disabled={!date || !weight || !bodyFat}>
                                        Log Metrics
                                    </Button>
                                </div>
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
