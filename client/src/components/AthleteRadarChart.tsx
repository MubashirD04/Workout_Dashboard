import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../hooks/useCurrentUser';

const ATTRIBUTE_LABELS = ['Power', 'Speed', 'Cardio', 'Endurance', 'Flexibility', 'Effectiveness'] as const;

const AthleteRadarChart = () => {
    const { user, isLoading: userLoading } = useCurrentUser();
    const profile = useQuery(
        api.athleteProfile.getMyAthleteProfile,
        user ? {} : 'skip'
    );

    const loading = userLoading || (!!user && profile === undefined);

    const data = ATTRIBUTE_LABELS.map((subject) => ({
        subject,
        A: profile ? profile[subject.toLowerCase() as keyof typeof profile] as number : 0,
        fullMark: 10,
    }));

    return (
        <div className="w-full h-[300px] glass-card p-6 flex flex-col">
            <p className="eyebrow mb-4">Athlete Profile</p>
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary/60" />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="48%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar
                            name={user?.name ?? 'You'}
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
            )}
        </div>
    );
};

export default AthleteRadarChart;
