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
        <div className="w-full h-[300px] glass-card p-6 flex flex-col">
            <p className="eyebrow mb-4">Athlete Profile</p>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="48%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                        name="Mike"
                        dataKey="A"
                        stroke="#C1754A"
                        strokeWidth={1.5}
                        fill="#C1754A"
                        fillOpacity={0.08}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0' }}
                        itemStyle={{ color: '#C1754A' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AthleteRadarChart;