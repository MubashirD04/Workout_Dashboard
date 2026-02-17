import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

const data = [
    { subject: 'Power', A: 120, fullMark: 150 },
    { subject: 'Speed', A: 98, fullMark: 150 },
    { subject: 'Cardio', A: 86, fullMark: 150 },
    { subject: 'Endurance', A: 99, fullMark: 150 },
    { subject: 'Flexibility', A: 85, fullMark: 150 },
    { subject: 'Effectiveness', A: 65, fullMark: 150 },
];

const AthleteRadarChart = () => {
    return (
        <div className="w-full h-[300px] glass-card p-4 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 text-primary text-glow">Athlete Profile</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="85%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                        name="Mike"
                        dataKey="A"
                        stroke="#F97316"
                        strokeWidth={2}
                        fill="#F97316"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#F97316' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AthleteRadarChart;
