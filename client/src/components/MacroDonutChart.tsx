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
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
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
                        formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MacroDonutChart;
