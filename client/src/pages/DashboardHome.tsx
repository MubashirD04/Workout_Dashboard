import React, { useMemo } from 'react';
import { usePaginatedQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { calculateWorkoutVolume } from '../utils/calculationUtils';
import { parseDateOnly, startOfWeek } from '../utils/dateUtils';
import AthleteRadarChart from '../components/AthleteRadarChart';
import VolumeLineChart from '../components/VolumeLineChart';
import MacroDonutChart from '../components/MacroDonutChart';
import ConsistencyHeatmap from '../components/ConsistencyHeatmap';
import { Card } from '../components/ui/Card';
import { useCurrentUser } from '../hooks/useCurrentUser';

const quickStats = [
    { label: 'One Rep Max (Bench)', value: '145', unit: 'kg', change: '+2.5%', positive: true },
    { label: 'Avg Heart Rate', value: '135', unit: 'bpm', change: '-1.2%', positive: true },
    { label: 'Sleep Quality', value: '88', unit: '%', change: '+5.0%', positive: true },
    { label: 'Body Fat', value: '12.4', unit: '%', change: '-0.4%', positive: true },
];

const DashboardHome: React.FC = () => {
    const { user } = useCurrentUser();
    const { isAuthenticated } = useConvexAuth();

    const { results: rawWorkouts } = usePaginatedQuery(
        (api as any).workouts.getWorkouts,
        isAuthenticated ? {} : 'skip',
        { initialNumItems: 100 }
    );
    const workouts = rawWorkouts || [];

    const { currentWeekVolume, weekOverWeekChange } = useMemo(() => {
        const now = new Date();
        const currentStart = startOfWeek(now);
        const previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);

        let current = 0;
        let previous = 0;

        workouts.forEach((w: any) => {
            if (!w.date) return;
            const wDate = parseDateOnly(w.date);
            const vol = calculateWorkoutVolume(w.exercises);
            if (wDate >= currentStart) {
                current += vol;
            } else if (wDate >= previousStart) {
                previous += vol;
            }
        });

        let change: number | null = null;
        if (previous > 0) {
            change = ((current - previous) / previous) * 100;
        } else if (current > 0) {
            change = 100;
        }

        return { currentWeekVolume: current, weekOverWeekChange: change };
    }, [workouts]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-normal text-white">
                        Welcome back, <span className="font-serif italic text-white/90">{user?.name?.split(' ')[0] ?? 'there'}</span>
                    </h2>
                    <p className="text-slate-500 mt-1.5 text-sm">Here's your performance overview for today.</p>
                </div>
                <div className="flex gap-3">
                    <Card className="px-5 py-3 flex flex-col gap-1 min-w-[112px]">
                        <span className="eyebrow">Streak</span>
                        <span className="text-xl font-semibold text-white/90">
                            12 <span className="text-sm font-normal text-slate-500">days</span>
                        </span>
                    </Card>
                    <Card className="px-5 py-3 flex flex-col gap-1 min-w-[140px]">
                        <span className="eyebrow">Volume (Week)</span>
                        <span className="text-xl font-semibold text-white/90">
                            {currentWeekVolume.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
                        </span>
                        {weekOverWeekChange !== null && (
                            <span className={`text-[11px] font-medium ${weekOverWeekChange >= 0 ? 'text-emerald-400/80' : 'text-rose-400/70'}`}>
                                {weekOverWeekChange >= 0 ? '+' : ''}{weekOverWeekChange.toFixed(1)}% vs last week
                            </span>
                        )}
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <AthleteRadarChart />
                </div>
                <div className="lg:col-span-2">
                    <VolumeLineChart workouts={workouts} />
                </div>
                <div className="lg:col-span-1">
                    <MacroDonutChart />
                </div>
                <div className="lg:col-span-2 min-h-[300px]">
                    <ConsistencyHeatmap workouts={workouts} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {quickStats.map((stat, i) => (
                    <Card key={i} className="p-5">
                        <p className="eyebrow mb-3">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-semibold text-white/90">
                                {stat.value}
                                <span className="text-sm font-normal text-slate-500 ml-1">{stat.unit}</span>
                            </span>
                            <span className={`text-[11px] font-medium ${stat.positive ? 'text-emerald-400/80' : 'text-rose-400/70'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default DashboardHome;