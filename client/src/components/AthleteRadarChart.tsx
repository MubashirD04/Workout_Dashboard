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
    { subject: 'Power', A: 90, fullMark: 100 },
    { subject: 'Speed', A: 85, fullMark: 100 },
    { subject: 'Cardio', A: 80, fullMark: 100 },
    { subject: 'Endurance', A: 95, fullMark: 100 },
    { subject: 'Flexibility', A: 70, fullMark: 100 },
    { subject: 'Effectiveness', A: 65, fullMark: 100 },
];

const AthleteRadarChart = () => {
    return (
        <div className="w-full h-[300px] glass-card p-4 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 text-primary text-glow">Athlete Profile</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="85%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
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
