import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const data = [
    { name: 'Protein', value: 180 },
    { name: 'Carbs', value: 250 },
    { name: 'Fats', value: 70 },
];

const COLORS = ['#F97316', '#334155', '#94a3b8']; // Orange, Slate-700, Slate-400

const MacroDonutChart = () => {
    return (
        <div className="w-full h-[300px] glass-card p-4 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-primary text-glow">Macro Distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="58%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        label={({ value }) => `${value}g`}
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#F97316' }}
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
        </div>
    );
};

export default MacroDonutChart;
