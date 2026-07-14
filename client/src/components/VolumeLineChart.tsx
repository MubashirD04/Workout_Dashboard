import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { calculateWorkoutVolume } from '../utils/calculationUtils';
import { parseDateOnly, startOfWeek } from '../utils/dateUtils';

interface Exercise {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
}

interface Workout {
    date: string;
    exercises?: Exercise[];
}

interface Props {
    workouts?: Workout[];
}

const DUMMY_DATA = [
    { name: 'Week 1', volume: 4000 },
    { name: 'Week 2', volume: 3000 },
    { name: 'Week 3', volume: 5000 },
    { name: 'Week 4', volume: 4580 },
    { name: 'Week 5', volume: 6890 },
    { name: 'Week 6', volume: 6390 },
    { name: 'Week 7', volume: 7490 },
];

const buildWeeklyVolume = (workouts: Workout[]) => {
    const buckets = new Map<number, number>();

    workouts.forEach((w) => {
        if (!w.date) return;
        const weekStart = startOfWeek(parseDateOnly(w.date)).getTime();
        const vol = calculateWorkoutVolume(w.exercises);
        buckets.set(weekStart, (buckets.get(weekStart) || 0) + vol);
    });

    const sortedWeeks = Array.from(buckets.keys()).sort((a, b) => a - b);
    const last7 = sortedWeeks.slice(-7);

    return last7.map((ts) => ({
        name: new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        volume: buckets.get(ts) || 0,
    }));
};

const VolumeLineChart: React.FC<Props> = ({ workouts = [] }) => {
    const realData = useMemo(() => buildWeeklyVolume(workouts), [workouts]);
    const isSample = realData.length === 0;
    const data = isSample ? DUMMY_DATA : realData;

    return (
        <div className="w-full h-[300px] glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <p className="eyebrow">Volume Over Time</p>
                {isSample && <span className="text-[10px] text-slate-600 italic">Sample data</span>}
            </div>
            <ResponsiveContainer width="100%" height="82%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#475569"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#475569"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0' }}
                        itemStyle={{ color: '#C1754A' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#C1754A"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#0d1117', stroke: '#C1754A', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#C1754A' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VolumeLineChart;