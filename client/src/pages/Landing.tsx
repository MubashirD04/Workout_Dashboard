import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import LandingBackground from '../components/LandingBackground';

type IconKey = 'workouts' | 'cardio' | 'metrics' | 'nutrition' | 'photos' | 'coach';

const FeatureIcon: React.FC<{ icon: IconKey }> = ({ icon }) => {
    const common = {
        className: 'w-5 h-5',
        fill: 'none' as const,
        stroke: 'currentColor' as const,
        viewBox: '0 0 24 24',
        strokeWidth: 1.8,
    };

    switch (icon) {
        case 'workouts':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7v10M18 7v10M2.5 10v4M21.5 10v4M6 12h12" />
                </svg>
            );
        case 'cardio':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2-5 4 10 2-5h6" />
                </svg>
            );
        case 'metrics':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V10M10 19V5M16 19v-7M3 19h18" />
                </svg>
            );
        case 'nutrition':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7c-2.5-3-6.5-2-6.5 2.2C5.5 14 9 19 12 19s6.5-5 6.5-9.8C18.5 5 14.5 4 12 7Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7c0-1.5.8-2.7 2-3.3" />
                </svg>
            );
        case 'photos':
            return (
                <svg {...common}>
                    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 18 5-5 3.5 3.5L18 12l1.5 1.5" />
                </svg>
            );
        case 'coach':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            );
        default:
            return null;
    }
};

const FEATURES: { icon: IconKey; title: string; blurb: string }[] = [
    { icon: 'workouts', title: 'Workout logging', blurb: 'Track exercises, sets, reps and weight with a log built for real training sessions.' },
    { icon: 'cardio', title: 'Cardio tracking', blurb: 'Distance, duration and pace, charted over time so trends are obvious at a glance.' },
    { icon: 'metrics', title: 'Body metrics', blurb: 'Weight, measurements and body fat — the numbers that actually track progress.' },
    { icon: 'nutrition', title: 'Nutrition', blurb: 'Daily calories and macro intake, visualised alongside your training load.' },
    { icon: 'photos', title: 'Progress photos', blurb: 'A private, visual timeline of physical change, only visible to you.' },
    { icon: 'coach', title: 'AI fitness coach', blurb: 'A RAG-powered coach that answers from real training literature and your own logged data.' },
];

const Landing: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white antialiased">
            {/* Nav */}
            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary shadow-glow-sm flex items-center justify-center shrink-0">
                            <span className="font-black text-white text-xs">FT</span>
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-bold text-white tracking-tight">FitTrack</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <SignInButton mode="modal">
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button variant="primary" size="sm">Get started</Button>
                        </SignUpButton>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <LandingBackground />
                <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-24 pb-28 sm:pt-32 sm:pb-36">
                    <div className="max-w-2xl">
                        <span className="eyebrow inline-flex items-center gap-2 text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-sm" />
                            Performance suite
                        </span>
                        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
                            Train with data,<br /> not guesswork.
                        </h1>
                        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                            FitTrack brings your workouts, cardio, nutrition, body metrics and progress
                            photos into one dashboard — plus an AI coach that knows both the science
                            and your own training history.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <SignUpButton mode="modal">
                                <Button variant="primary" size="lg">Get started free</Button>
                            </SignUpButton>
                            <SignInButton mode="modal">
                                <Button variant="ghost" size="lg">Sign in</Button>
                            </SignInButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="relative py-20 sm:py-28 border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-5 sm:px-8">
                    <div className="max-w-xl mb-12">
                        <span className="eyebrow text-primary">Everything in one place</span>
                        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                            One dashboard for every part of training
                        </h2>
                        <p className="mt-3 text-sm text-slate-500">
                            No spreadsheets, no scattered apps — log it once and see it everywhere.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f) => (
                            <Card key={f.title} className="p-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    <FeatureIcon icon={f.icon} />
                                </div>
                                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.blurb}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trainers / roles */}
            <section className="relative py-20 sm:py-28 border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="eyebrow text-primary">For coaches and athletes</span>
                        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                            Built for trainers and their clients
                        </h2>
                        <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-md">
                            Trainers get an invite-code onboarding flow and a full view of assigned
                            clients' workouts, cardio, metrics and nutrition — progress photos stay
                            private to the client. Role-based access is enforced everywhere, not just
                            in the UI.
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-slate-400">
                            <li className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                                Generate invite codes and link clients in seconds
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                                Review client training load without leaving the dashboard
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                                Admin controls for roles and trainer–client assignments
                            </li>
                        </ul>
                    </div>
                    <Card className="p-6 sm:p-8">
                        <p className="eyebrow mb-4">AI Coach</p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            "Based on your last four weeks of squat sessions, your working volume has
                            climbed 12% but bar speed on your top sets is dropping — that usually means
                            it's time for a deload week before you push for a new max."
                        </p>
                        <div className="mt-5 pt-5 border-t border-white/[0.07] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary shadow-glow-sm" />
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                                Grounded in your data + training literature
                            </span>
                        </div>
                    </Card>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-20 sm:py-24 border-t border-white/[0.06]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                        Start training smarter today
                    </h2>
                    <p className="mt-3 text-sm text-slate-500">
                        Free to join. Your data, your progress, one dashboard.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <SignUpButton mode="modal">
                            <Button variant="primary" size="lg">Get started free</Button>
                        </SignUpButton>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                            <span className="font-black text-white text-[10px]">FT</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">FitTrack</span>
                    </div>
                    <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} FitTrack. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
