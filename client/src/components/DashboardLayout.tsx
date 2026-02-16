import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Overview' },
        { path: '/workouts', label: 'Workouts' },
        { path: '/cardio', label: 'Cardio' },
        { path: '/metrics', label: 'Metrics' },
        { path: '/nutrition', label: 'Nutrition' },
        { path: '/photos', label: 'Photos' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-primary/30">
            <header className="sticky top-0 z-50 glass-card rounded-none border-b border-white/5 shadow-glow/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-primary shadow-glow flex items-center justify-center">
                                    <span className="font-bold text-white">FT</span>
                                </div>
                                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">FitTrack</h1>
                            </div>
                            <div className="hidden sm:flex sm:space-x-1">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`${isActive
                                                ? 'text-primary'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                } px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group`}
                                        >
                                            {item.label}
                                            {isActive && (
                                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-glow rounded-full"></span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs text-slate-400">
                                MP
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
