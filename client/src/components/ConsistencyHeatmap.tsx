import { useMemo } from 'react';
import { calculateWorkoutVolume } from '../utils/calculationUtils';

interface Exercise {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
}

interface Workout {
    date: string;
    exercises?: Exercise[];
}

interface Props {
    workouts?: Workout[];
}

interface Day {
    day: number;
    intensity: number;
    label: string;
}

const INTENSITY_LABELS = ['Rest', 'Light', 'Medium', 'Heavy'];

const buildRealDays = (workouts: Workout[]): { days: Day[]; hasData: boolean } => {
    const volumeByDate = new Map<string, number>();

    workouts.forEach((w) => {
        if (!w.date) return;
        const key = w.date.split('T')[0];
        const vol = calculateWorkoutVolume(w.exercises);
        volumeByDate.set(key, (volumeByDate.get(key) || 0) + vol);
    });

    const maxVolume = Math.max(0, ...Array.from(volumeByDate.values()));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Day[] = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const vol = volumeByDate.get(key) || 0;

        let intensity = 0;
        if (vol > 0 && maxVolume > 0) {
            const ratio = vol / maxVolume;
            intensity = ratio <= 0.33 ? 1 : ratio <= 0.66 ? 2 : 3;
        }

        days.push({
            day: 89 - i,
            intensity,
            label: `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${INTENSITY_LABELS[intensity]}`,
        });
    }

    return { days, hasData: volumeByDate.size > 0 };
};

const buildDummyDays = (): Day[] =>
    Array.from({ length: 90 }, (_, i) => {
        const intensity = Math.floor(Math.random() * 4);
        return { day: i, intensity, label: `Day ${i + 1}: ${INTENSITY_LABELS[intensity]}` };
    });

const getIntensityClass = (intensity: number) => {
    switch (intensity) {
        case 0: return 'bg-white/[0.04]';
        case 1: return 'bg-primary/25';
        case 2: return 'bg-primary/50';
        case 3: return 'bg-primary/85 shadow-glow-sm';
        default: return 'bg-white/[0.04]';
    }
};

const ConsistencyHeatmap: React.FC<Props> = ({ workouts = [] }) => {
    const { days: realDays, hasData } = useMemo(() => buildRealDays(workouts), [workouts]);
    const dummyDays = useMemo(() => buildDummyDays(), []);
    const isSample = !hasData;
    const days = isSample ? dummyDays : realDays;

    return (
        <div className="w-full h-full glass-card p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p className="eyebrow">Consistency</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Last 90 days</p>
                </div>
                {isSample && <span className="text-[10px] text-slate-600 italic">Sample data</span>}
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
                {days.map((d) => (
                    <div
                        key={d.day}
                        className={`w-3 h-3 rounded-[3px] ${getIntensityClass(d.intensity)} transition-all duration-300 hover:scale-125`}
                        title={d.label}
                    />
                ))}
            </div>
            <div className="flex items-center justify-end mt-5 gap-1.5 text-[10px] text-slate-600 uppercase tracking-widest">
                <span>Less</span>
                <div className="w-3 h-3 rounded-[3px] bg-white/[0.04]"></div>
                <div className="w-3 h-3 rounded-[3px] bg-primary/25"></div>
                <div className="w-3 h-3 rounded-[3px] bg-primary/50"></div>
                <div className="w-3 h-3 rounded-[3px] bg-primary/85"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default ConsistencyHeatmap;