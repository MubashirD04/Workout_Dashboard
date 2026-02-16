import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const data = [
    { name: 'Week 1', volume: 4000 },
    { name: 'Week 2', volume: 3000 },
    { name: 'Week 3', volume: 5000 },
    { name: 'Week 4', volume: 4580 },
    { name: 'Week 5', volume: 6890 },
    { name: 'Week 6', volume: 6390 },
    { name: 'Week 7', volume: 7490 },
];

const VolumeLineChart = () => {
    return (
        <div className="w-full h-[300px] glass-card p-4">
            <h3 className="text-xl font-bold mb-4 text-primary text-glow">Volume Over Time</h3>
            <ResponsiveContainer width="100%" height="85%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#F97316' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#F97316"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#1e293b', stroke: '#F97316', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#F97316' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VolumeLineChart;
