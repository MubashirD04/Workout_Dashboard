import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card } from '../../components/ui/Card';
import { AthleteProfileForm, type AthleteProfileRatings } from '../../components/AthleteProfileForm';
import LandingBackground from '../../components/LandingBackground';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getErrorMessage } from '../../utils/errorUtils';

// Shown once, before the dashboard, for any signed-in user with no athlete
// profile row yet. Blocking by design — see docs/context.md "Known Frontend
// Gaps" (AthleteRadarChart previously rendered static placeholder data).
// Reuses Landing's ambient background so the first thing a new user sees
// after signing up feels like a continuation of the marketing page, not a gate.
const AthleteProfileOnboarding: React.FC = () => {
    const { user } = useCurrentUser();
    const upsert = useMutation(api.athleteProfile.upsertMyAthleteProfile);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (ratings: AthleteProfileRatings) => {
        setSubmitting(true);
        setError(null);
        try {
            await upsert(ratings);
            // No manual navigation needed: getMyAthleteProfile is reactive, so
            // the gate re-renders into the dashboard as soon as this resolves.
        } catch (err) {
            setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen text-white overflow-hidden">
            <LandingBackground />

            <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-10 sm:py-14">
                <div className="flex items-center gap-2.5 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-primary shadow-glow-sm flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={4}
                            strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                            <path d="M10 34 A16 16 0 1 1 38 34" />
                            <line x1="24" y1="24" x2="33" y2="13" />
                            <circle cx="24" cy="24" r="2.4" fill="currentColor" stroke="none" />
                        </svg>
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">Gauge</span>
                </div>

                <div className="w-full max-w-2xl flex-1 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <span className="eyebrow inline-flex items-center gap-2 text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-sm" />
                            Last step before your dashboard
                        </span>
                        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                            {user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Welcome to Gauge'}
                        </h1>
                        <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                            Rate yourself 1–10 across six attributes so we can build your Athlete Profile —
                            it powers the radar chart on your dashboard from day one.
                        </p>
                    </div>

                    <Card className="p-6 sm:p-8">
                        <AthleteProfileForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Continue to dashboard" />
                        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
                    </Card>

                    <p className="mt-5 text-center text-xs text-slate-600">
                        Takes about 30 seconds — you can change these ratings any time from your profile page.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AthleteProfileOnboarding;
