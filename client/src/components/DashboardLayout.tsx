import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FloatingChat from './FloatingChat';
import { UserButton } from "@clerk/clerk-react";
import { useCurrentUser } from '../hooks/useCurrentUser';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

type IconKey = 'overview' | 'workouts' | 'cardio' | 'metrics' | 'nutrition' | 'photos' | 'clients' | 'admin';

interface NavItem {
    path: string;
    label: string;
    icon: IconKey;
}

// Minimal inline stroke icons — keeps the sidebar dependency-free (no icon package installed).
const NavIcon: React.FC<{ icon: IconKey; className?: string }> = ({ icon, className = 'w-5 h-5' }) => {
    const common = {
        className,
        fill: 'none' as const,
        stroke: 'currentColor' as const,
        viewBox: '0 0 24 24',
        strokeWidth: 1.8,
    };

    switch (icon) {
        case 'overview':
            return (
                <svg {...common}>
                    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
                </svg>
            );
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
        case 'clients':
            return (
                <svg {...common}>
                    <circle cx="9" cy="8" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
                    <circle cx="17" cy="8.5" r="2.3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 13.3c2.4.3 4.2 2.4 4.2 5.2" />
                </svg>
            );
        case 'admin':
            return (
                <svg {...common}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 5 6v5.5c0 4.6 3 7.8 7 9 4-1.2 7-4.4 7-9V6l-7-2.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9.3 12 1.9 1.9 3.5-3.9" />
                </svg>
            );
        default:
            return null;
    }
};

// Drives the topbar breadcrumb + heading — mirrors the "Pages / Current page" pattern
// used by both reference dashboards.
const PAGE_META: Record<string, { section: string; title: string; blurb: string }> = {
    '/': { section: 'Dashboard', title: 'Overview', blurb: "Today's performance at a glance" },
    '/workouts': { section: 'Fitness', title: 'Workouts', blurb: 'Log and review strength sessions' },
    '/cardio': { section: 'Fitness', title: 'Cardio', blurb: 'Track distance, pace and duration' },
    '/metrics': { section: 'Fitness', title: 'Body metrics', blurb: 'Weight, measurements and body fat' },
    '/nutrition': { section: 'Fitness', title: 'Nutrition', blurb: 'Daily calories and macro intake' },
    '/photos': { section: 'Fitness', title: 'Progress photos', blurb: 'A visual timeline of your progress' },
    '/clients': { section: 'Team', title: 'Clients', blurb: 'Manage assigned clients and invites' },
    '/admin': { section: 'System', title: 'Admin panel', blurb: 'Users, roles and permissions' },
};

function getPageMeta(pathname: string) {
    if (PAGE_META[pathname]) return PAGE_META[pathname];
    if (pathname.startsWith('/clients/')) {
        return { section: 'Team', title: 'Client detail', blurb: 'Reviewing an individual client' };
    }
    if (pathname.startsWith('/invite/')) {
        return { section: 'Account', title: 'Claim invite', blurb: 'Link your account to a trainer' };
    }
    return PAGE_META['/'];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, isAdmin, canViewClients } = useCurrentUser();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Close the mobile drawer automatically whenever the route changes.
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);

    const navItems: NavItem[] = [
        { path: '/', label: 'Overview', icon: 'overview' },
        { path: '/workouts', label: 'Workouts', icon: 'workouts' },
        { path: '/cardio', label: 'Cardio', icon: 'cardio' },
        { path: '/metrics', label: 'Metrics', icon: 'metrics' },
        { path: '/nutrition', label: 'Nutrition', icon: 'nutrition' },
        { path: '/photos', label: 'Photos', icon: 'photos' },
    ];

    if (canViewClients) {
        navItems.push({ path: '/clients', label: 'Clients', icon: 'clients' });
    }
    if (isAdmin) {
        navItems.push({ path: '/admin', label: 'Admin', icon: 'admin' });
    }

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const meta = getPageMeta(location.pathname);

    return (
        <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-primary/30">

            {/* Mobile overlay */}
            {mobileNavOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileNavOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed z-50 top-3 bottom-3 left-3 w-64 flex flex-col glass-card transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    mobileNavOpen ? 'translate-x-0' : '-translate-x-[calc(100%_+_0.75rem)]'
                }`}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 px-5 pt-6 pb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary shadow-glow flex items-center justify-center shrink-0">
                        <span className="font-black text-white text-sm">FT</span>
                    </div>
                    <div className="leading-tight min-w-0">
                        <p className="text-base font-bold text-white tracking-tight truncate">FitTrack</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Performance suite</p>
                    </div>
                </div>

                <div className="h-px bg-white/5 mx-5" />

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                aria-current={active ? 'page' : undefined}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    active
                                        ? 'bg-primary text-white shadow-glow'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span
                                    className={`flex items-center justify-center shrink-0 transition-colors ${
                                        active ? 'text-white' : 'text-slate-500 group-hover:text-primary'
                                    }`}
                                >
                                    <NavIcon icon={item.icon} />
                                </span>
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="h-px bg-white/5 mx-5" />

                {/* User card */}
                <div className="p-4">
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                        <UserButton afterSignOutUrl="/" />
                        <div className="min-w-0 leading-tight">
                            <p className="text-xs font-bold text-white truncate">{user?.name ?? 'Loading…'}</p>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest truncate">{user?.role ?? '—'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content column — offset to clear the fixed sidebar on large screens */}
            <div className="lg:pl-[17.5rem]">
                {/* Topbar: breadcrumb + current page title, like both reference dashboards */}
                <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 pt-3">
                    <div className="glass-card px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => setMobileNavOpen(true)}
                                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                                aria-label="Open navigation"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                    {meta.section}
                                    <span className="text-slate-700 mx-1.5">/</span>
                                    <span className="text-primary">{meta.title}</span>
                                </p>
                                <h1 className="text-lg sm:text-xl font-bold text-white truncate">{meta.title}</h1>
                            </div>
                        </div>
                        <p className="hidden md:block text-xs text-slate-500 font-medium truncate max-w-xs text-right">
                            {meta.blurb}
                        </p>
                    </div>
                </header>

                <main className="px-4 sm:px-6 lg:px-8 py-6">
                    {children}
                </main>
            </div>

            <FloatingChat />
        </div>
    );
};

export default DashboardLayout;
