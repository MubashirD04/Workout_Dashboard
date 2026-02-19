import React, { useState, useMemo } from 'react';
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    ComposedChart
} from 'recharts';

interface CardioLog {
    id: number;
    date: string;
    type: string;
    distance: number;
    duration: number;
    time: string | null;
}

interface Props {
    logs: CardioLog[];
}

const CardioProgressChart: React.FC<Props> = ({ logs }) => {
    const [selectedType, setSelectedType] = useState<string>('Run');

    // Get unique activity types present in the logs
    const activityTypes = useMemo(() => {
        const types = Array.from(new Set(logs.map(log => log.type)));
        // Ensure Run is always an option or at least the default if it exists
        if (types.length === 0) return ['Run'];
        return types.sort();
    }, [logs]);

    // Update selected type if current selection no longer exists in logs
    React.useEffect(() => {
        if (logs.length > 0 && !activityTypes.includes(selectedType)) {
            setSelectedType(activityTypes[0]);
        }
    }, [activityTypes, logs.length, selectedType]);

    // Filter and sort logs by date and calculate pace
    const chartData = useMemo(() => {
        return [...logs]
            .filter(log => log.type === selectedType)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(log => {
                const pace = log.distance > 0 ? parseFloat((log.duration / log.distance).toFixed(2)) : 0;
                return {
                    date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    distance: log.distance,
                    pace: pace,
                    type: log.type
                };
            });
    }, [logs, selectedType]);

    return (
        <div className="w-full h-[500px] glass-card p-6 sm:p-8 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Pace & Distance Trends</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Performance Analysis</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {activityTypes.map(t => (
                        <button
                            key={t}
                            onClick={() => setSelectedType(t)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedType === t
                                ? 'bg-primary border-primary text-white shadow-glow-sm'
                                : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow-sm"></span>
                        <span className="text-slate-300">Distance</span>
                    </div>
                    <div className="flex items-center gap-1.5 ">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
                        <span className="text-slate-300">Pace</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#F97316"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#60A5FA"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                padding: '12px'
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                        />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="distance"
                            stroke="#F97316"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorDistance)"
                            activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="pace"
                            stroke="#60A5FA"
                            strokeWidth={4}
                            dot={{ r: 4, fill: '#0f172a', stroke: '#60A5FA', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#60A5FA', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {chartData.length === 0 && (
                <div className="absolute inset-x-0 bottom-20 flex justify-center pointer-events-none">
                    <p className="text-slate-500 text-sm font-medium bg-slate-900/80 px-4 py-2 rounded-lg border border-white/5 backdrop-blur-sm">
                        No data recorded for this activity yet.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CardioProgressChart;
