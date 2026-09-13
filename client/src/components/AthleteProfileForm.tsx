import React, { useState } from 'react';
import { Button } from './ui/Button';

export interface AthleteProfileRatings {
    power: number;
    speed: number;
    cardio: number;
    endurance: number;
    flexibility: number;
    effectiveness: number;
}

const DEFAULT_RATINGS: AthleteProfileRatings = {
    power: 5,
    speed: 5,
    cardio: 5,
    endurance: 5,
    flexibility: 5,
    effectiveness: 5,
};

type IconKey = 'power' | 'speed' | 'cardio' | 'endurance' | 'flexibility' | 'effectiveness';

// Matches the stroke-icon convention used elsewhere (DashboardLayout's NavIcon,
// Landing's FeatureIcon) — no icon package installed, keep it dependency-free.
const AttributeIcon: React.FC<{ icon: IconKey }> = ({ icon }) => {
    const common = {
        className: 'w-4 h-4',
        fill: 'none' as const,
        stroke: 'currentColor' as const,
        viewBox: '0 0 24 24',
        strokeWidth: 1.8,
    };

    switch (icon) {
        case 'power':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3 5 13.5h5.5L11 21l8-11h-5.5L13 3Z" />
                </svg>
            );
        case 'speed':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 5 5-5 5" opacity="0.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11 7 5 5-5 5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18 7 5 5-5 5" opacity="0.5" />
                </svg>
            );
        case 'cardio':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2-5 4 10 2-5h6" />
                </svg>
            );
        case 'endurance':
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="8.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.2 2" />
                </svg>
            );
        case 'flexibility':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 17c3-1 4.5-3.5 4.5-6.5S7 5 9.5 5s4 2.2 4 5.5S15.5 17 20 17" />
                </svg>
            );
        case 'effectiveness':
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="8.5" />
                    <circle cx="12" cy="12" r="4.5" />
                    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
                </svg>
            );
        default:
            return null;
    }
};

const ATHLETE_PROFILE_ATTRIBUTES: { key: keyof AthleteProfileRatings; label: string; blurb: string }[] = [
    { key: 'power', label: 'Power', blurb: 'Explosive strength — max lifts, jumps, sprints off the line' },
    { key: 'speed', label: 'Speed', blurb: 'How fast you move — sprint pace, hand speed, agility' },
    { key: 'cardio', label: 'Cardio', blurb: 'Aerobic capacity — sustained effort without gassing out' },
    { key: 'endurance', label: 'Endurance', blurb: 'Staying power across a long session or workday' },
    { key: 'flexibility', label: 'Flexibility', blurb: 'Range of motion — mobility through full lifts and stretches' },
    { key: 'effectiveness', label: 'Effectiveness', blurb: 'How well your training translates into real results' },
];

function tierLabel(value: number): string {
    if (value <= 2) return 'Just starting';
    if (value <= 4) return 'Developing';
    if (value <= 6) return 'Solid';
    if (value <= 8) return 'Strong';
    return 'Elite';
}

interface RatingBarProps {
    id: string;
    icon: IconKey;
    label: string;
    blurb: string;
    value: number;
    onChange: (value: number) => void;
}

const RatingBar: React.FC<RatingBarProps> = ({ id, icon, label, blurb, value, onChange }) => {
    const fillPct = ((value - 1) / 9) * 100;

    return (
        <div>
            <div className="flex items-center gap-2.5 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary shrink-0">
                    <AttributeIcon icon={icon} />
                </span>
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <label htmlFor={id} className="text-xs font-bold text-white uppercase tracking-wide truncate">
                        {label}
                    </label>
                    <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
                        {value}<span className="text-slate-600">/10</span>
                        <span className="ml-1.5 text-slate-500 font-medium normal-case">{tierLabel(value)}</span>
                    </span>
                </div>
            </div>

            <div className="relative h-9 flex items-center">
                {/* Decorative track + fill, purely visual — the input above carries the real value/interaction. */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/10 overflow-hidden pointer-events-none">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-150"
                        style={{ width: `${fillPct}%` }}
                    />
                </div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 flex justify-between pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <span key={i} className="w-px h-full bg-slate-950/50" />
                    ))}
                </div>
                <input
                    id={id}
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    aria-label={`${label} rating`}
                    aria-valuetext={`${value} out of 10 — ${tierLabel(value)}`}
                    className="rating-slider absolute inset-0 w-full h-full m-0"
                />
            </div>

            <p className="mt-1.5 text-xs text-slate-500 leading-snug">{blurb}</p>
        </div>
    );
};

interface AthleteProfileFormProps {
    initialValues?: AthleteProfileRatings;
    onSubmit: (values: AthleteProfileRatings) => Promise<void> | void;
    submitLabel?: string;
    submitting?: boolean;
}

export const AthleteProfileForm: React.FC<AthleteProfileFormProps> = ({
    initialValues,
    onSubmit,
    submitLabel = 'Save',
    submitting = false,
}) => {
    const [ratings, setRatings] = useState<AthleteProfileRatings>(initialValues ?? DEFAULT_RATINGS);

    const setRating = (key: keyof AthleteProfileRatings, value: number) => {
        setRatings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(ratings);
            }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
                {ATHLETE_PROFILE_ATTRIBUTES.map(({ key, label, blurb }) => (
                    <RatingBar
                        key={key}
                        id={`athlete-rating-${key}`}
                        icon={key}
                        label={label}
                        blurb={blurb}
                        value={ratings[key]}
                        onChange={(value) => setRating(key, value)}
                    />
                ))}
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? 'Saving…' : submitLabel}
            </Button>
        </form>
    );
};

export { ATHLETE_PROFILE_ATTRIBUTES };
export default AthleteProfileForm;
