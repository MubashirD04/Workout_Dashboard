import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { nutritionApi } from '../api/trackingApi';
import { useFetch } from '../hooks/useFetch';

const COLORS = ['#F97316', '#334155', '#94a3b8']; // Orange (Protein), Slate-700 (Carbs), Slate-400 (Fat)

const MacroDonutChart = () => {
    const { data: logs, loading } = useFetch(nutritionApi.getAll);

    const getAverages = () => {
        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            return [
                { name: 'Protein', value: 0 },
                { name: 'Carbs', value: 0 },
                { name: 'Fat', value: 0 },
            ];
        }

        const totals = logs.reduce(
            (acc, log) => ({
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
        <div className="w-full h-[300px] glass-card p-4 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-primary text-glow">Macro Distribution</h3>

            <div className="w-full h-[80%]">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : !hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                        <span className="text-2xl mb-2">📊</span>
                        <p className="italic">No nutrition data available</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="58%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                label={({ value }) => `${value}g`}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                itemStyle={{ color: '#F97316' }}
                                formatter={(value) => [`${value}g (avg)`, '']}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '25px' }}
                                formatter={(value) => <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default MacroDonutChart;
