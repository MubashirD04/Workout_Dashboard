import React from 'react';
import AthleteRadarChart from '../components/AthleteRadarChart';
import VolumeLineChart from '../components/VolumeLineChart';
import MacroDonutChart from '../components/MacroDonutChart';
import ConsistencyHeatmap from '../components/ConsistencyHeatmap';
import { Card } from '../components/ui/Card';

const DashboardHome: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Welcome back, Mike</h2>
                    <p className="text-slate-400 mt-1">Here's your performance overview for today.</p>
                </div>
                <div className="flex gap-3">
                    <Card className="px-4 py-2 flex flex-col">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Streak</span>
                        <span className="text-xl font-bold text-primary text-glow">12 Days</span>
                    </Card>
                    <Card className="px-4 py-2 flex flex-col">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Volume</span>
                        <span className="text-xl font-bold text-white">42,500 kg</span>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Row 1: Key Metrics & Radar */}
                <div className="lg:col-span-1">
                    <AthleteRadarChart />
                </div>

                <div className="lg:col-span-2">
                    <VolumeLineChart />
                </div>

                {/* Row 2: Macros & Heatmap */}
                <div className="lg:col-span-1">
                    <MacroDonutChart />
                </div>

                <div className="lg:col-span-2 min-h-[300px]">
                    <ConsistencyHeatmap />
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'One Rep Max (Bench)', value: '145 kg', change: '+2.5%' },
                    { label: 'Avg Heart Rate', value: '135 bpm', change: '-1.2%' },
                    { label: 'Sleep Quality', value: '88%', change: '+5.0%' },
                    { label: 'Body Fat', value: '12.4%', change: '-0.4%' },
                ].map((stat, i) => (
                    <Card key={i} className="p-4 hover:bg-white/5 transition-colors">
                        <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-white">{stat.value}</span>
                            <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-primary'}`}>
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
