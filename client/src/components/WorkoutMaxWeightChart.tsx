import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface Exercise {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
}

interface Workout {
    id: number;
    date: string;
    exercises?: Exercise[];
}

interface Props {
    workouts: Workout[];
}

const WorkoutMaxWeightChart: React.FC<Props> = ({ workouts }) => {
    const chartData = useMemo(() => {
        const maxWeights: Record<string, number> = {};

        workouts.forEach(workout => {
            workout.exercises?.forEach(ex => {
                const name = ex.exercise_name;
                const weight = Number(ex.weight);
                if (!maxWeights[name] || weight > maxWeights[name]) {
                    maxWeights[name] = weight;
                }
            });
        });

        return Object.entries(maxWeights)
            .map(([name, weight]) => ({
                name,
                maxWeight: weight
            }))
            .sort((a, b) => b.maxWeight - a.maxWeight) // Sort by weight descending
            .slice(0, 10); // Top 10 exercises
    }, [workouts]);

    if (chartData.length === 0) return null;

    return (
        <div className="w-full h-[400px] glass-card p-6 sm:p-8 overflow-hidden mt-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shadow-glow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Strength Benchmarks</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Max Weight per Exercise (kg)</p>
                    </div>
                </div>
            </div>

            <div className="h-[80%] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 40, left: -10, bottom: 20 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.3} />
                        <XAxis
                            type="number"
                            stroke="#64748b"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#cbd5e1"
                            fontSize={12}
                            fontWeight="800"
                            tickLine={false}
                            axisLine={false}
                            width={140}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                padding: '12px'
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#60A5FA' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase' }}
                        />
                        <Bar
                            dataKey="maxWeight"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === 0 ? '#3B82F6' : '#3B82F6cc'}
                                    className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WorkoutMaxWeightChart;
