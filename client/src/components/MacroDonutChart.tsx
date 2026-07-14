import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { usePaginatedQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const COLORS = ['#C1754A', '#334155', '#64748b']; // Protein, Carbs, Fat

const MacroDonutChart = () => {
    const { isAuthenticated } = useConvexAuth();

    const { results: logs, status } = usePaginatedQuery(
        (api as any).nutritionLogs.getNutritionLogs,
        isAuthenticated ? {} : "skip",
        { initialNumItems: 60 }
    );
    const loading = !isAuthenticated || status === "LoadingFirstPage";

    const getAverages = () => {
        if (!logs || logs.length === 0) {
            return [
                { name: 'Protein', value: 0 },
                { name: 'Carbs', value: 0 },
                { name: 'Fat', value: 0 },
            ];
        }

        const totals = logs.reduce(
            (acc, log: any) => ({
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fat: acc.fat + (log.fat || 0),
            }),
            { protein: 0, carbs: 0, fat: 0 }
        );

        return [
            { name: 'Protein', value: Math.round(totals.protein / logs.length) },
            { name: 'Carbs', value: Math.round(totals.carbs / logs.length) },
            { name: 'Fat', value: Math.round(totals.fat / logs.length) },
        ];
    };

    const chartData = getAverages();
    const hasData = chartData.some(d => d.value > 0);

    return (
        <div className="w-full h-[300px] glass-card p-6 flex flex-col">
            <p className="eyebrow mb-4">Macro Distribution</p>

            <div className="w-full flex-1">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/60"></div>
                    </div>
                ) : !hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                        <p className="italic">No nutrition data yet</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="58%"
                                innerRadius={68}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                label={({ value }) => `${value}g`}
                                labelLine={false}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0' }}
                                itemStyle={{ color: '#C1754A' }}
                                formatter={(value) => [`${value}g (avg)`, '']}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={30}
                                iconType="circle"
                                iconSize={7}
                                wrapperStyle={{ paddingTop: '18px' }}
                                formatter={(value) => <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default MacroDonutChart;