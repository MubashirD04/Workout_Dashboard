import React, { useState } from 'react';
import { UserProfile, SignOutButton } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AthleteProfileForm, ATHLETE_PROFILE_ATTRIBUTES, type AthleteProfileRatings } from '../components/AthleteProfileForm';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    trainer: 'Trainer',
    client: 'Client',
};

const Profile: React.FC = () => {
    const { user, isLoading } = useCurrentUser();
    const athleteProfile = useQuery(
        (api as any).athleteProfile.getMyAthleteProfile,
        user ? {} : 'skip'
    );
    const upsertAthleteProfile = useMutation((api as any).athleteProfile.upsertMyAthleteProfile);
    const [savingAthleteProfile, setSavingAthleteProfile] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [athleteProfileExpanded, setAthleteProfileExpanded] = useState(false);

    const requestTrainerAccess = useMutation((api as any).users.requestTrainerAccess);
    const cancelTrainerRequest = useMutation((api as any).users.cancelTrainerRequest);
    const [trainerRequestSubmitting, setTrainerRequestSubmitting] = useState(false);
    const [trainerRequestError, setTrainerRequestError] = useState<string | null>(null);

    const handleRequestTrainerAccess = async () => {
        setTrainerRequestSubmitting(true);
        setTrainerRequestError(null);
        try {
            await requestTrainerAccess();
        } catch (err) {
            setTrainerRequestError(err instanceof Error ? err.message : 'Could not submit your request.');
        } finally {
            setTrainerRequestSubmitting(false);
        }
    };

    const handleCancelTrainerRequest = async () => {
        setTrainerRequestSubmitting(true);
        setTrainerRequestError(null);
        try {
            await cancelTrainerRequest();
        } catch (err) {
            setTrainerRequestError(err instanceof Error ? err.message : 'Could not cancel your request.');
        } finally {
            setTrainerRequestSubmitting(false);
        }
    };

    const memberSince = user
        ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    const handleAthleteProfileSubmit = async (ratings: AthleteProfileRatings) => {
        setSavingAthleteProfile(true);
        setSaveError(null);
        try {
            await upsertAthleteProfile(ratings);
            setSavedAt(Date.now());
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Could not save your athlete profile.');
        } finally {
            setSavingAthleteProfile(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-end">
                <SignOutButton redirectUrl="/">
                    <Button variant="secondary" size="sm" className="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20">
                        Sign Out
                    </Button>
                </SignOutButton>
            </div>

            <div className="p-6 sm:p-4">
                {isLoading ? (
                    <p className="text-slate-400 text-sm">Loading profile...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Name</p>
                            <p className="text-white font-semibold truncate">{user?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                            <p className="text-white font-semibold truncate">{user?.email ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Role</p>
                            <p className="text-primary font-semibold">{user ? (ROLE_LABELS[user.role] ?? user.role) : '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Member Since</p>
                            <p className="text-white font-semibold">{memberSince ?? '—'}</p>
                        </div>
                    </div>
                )}
            </div>

            {user?.role === 'client' && (
                <Card className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight truncate">Trainer Access</h2>
                            <p className="text-slate-400 text-xs font-medium mt-1 max-w-md">
                                {user.trainerRequestedAt
                                    ? 'Your request is waiting on an admin to review it. You\'ll see your role update here once it\'s approved.'
                                    : 'Coach other clients? Request trainer access — an admin reviews every request before it\'s granted.'}
                            </p>
                        </div>
                        {user.trainerRequestedAt ? (
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 whitespace-nowrap">
                                    Pending review
                                </span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleCancelTrainerRequest}
                                    disabled={trainerRequestSubmitting}
                                >
                                    {trainerRequestSubmitting ? 'Cancelling…' : 'Cancel request'}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleRequestTrainerAccess}
                                disabled={trainerRequestSubmitting}
                                className="shrink-0"
                            >
                                {trainerRequestSubmitting ? 'Submitting…' : 'Request trainer access'}
                            </Button>
                        )}
                    </div>
                    {trainerRequestError && <p className="mt-3 text-sm text-red-400">{trainerRequestError}</p>}
                </Card>
            )}

            <Card className="p-6 sm:p-8">
                <div
                    className="flex justify-between items-center cursor-pointer relative z-30 gap-4"
                    onClick={() => setAthleteProfileExpanded((o) => !o)}
                >
                    <div className="flex items-center gap-4 group/arrow min-w-0">
                        <div className={`p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover/arrow:bg-primary group-hover/arrow:text-white shadow-glow-sm group-active/arrow:scale-90 shrink-0 ${athleteProfileExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight truncate">Athlete Profile</h2>
                            <p className="text-slate-400 text-xs font-medium truncate">
                                Self-rated 1–10 &middot; drives your dashboard radar chart
                            </p>
                        </div>
                    </div>

                    {savedAt && !savingAthleteProfile && (
                        <span className="text-xs font-semibold text-emerald-400/80 shrink-0">Saved</span>
                    )}
                </div>

                {athleteProfile && (
                    <div
                        className={`grid transition-all duration-300 ease-in-out ${athleteProfileExpanded ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100 mt-4'} overflow-hidden`}
                    >
                        <div className="min-h-0 flex flex-wrap gap-2">
                            {ATHLETE_PROFILE_ATTRIBUTES.map(({ key, label }) => (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap"
                                >
                                    {label} <span className="text-white font-bold tabular-nums">{athleteProfile[key]}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    className={`grid transition-all duration-500 ease-in-out ${athleteProfileExpanded ? 'grid-rows-[1fr] opacity-100 mt-8' : 'grid-rows-[0fr] opacity-0 mt-0'} overflow-hidden relative z-10`}
                >
                    <div className="min-h-0">
                        {athleteProfile === undefined ? (
                            <p className="text-slate-400 text-sm">Loading athlete profile...</p>
                        ) : (
                            <AthleteProfileForm
                                initialValues={athleteProfile ?? undefined}
                                onSubmit={handleAthleteProfileSubmit}
                                submitting={savingAthleteProfile}
                                submitLabel="Save changes"
                            />
                        )}
                        {saveError && <p className="mt-4 text-sm text-red-400">{saveError}</p>}
                    </div>
                </div>
            </Card>

            {/* Clerk's own account UI handles editing name/email/password/avatar/security */}
            <Card className="p-2 sm:p-4 overflow-hidden">
                <UserProfile
                    routing="hash"
                    appearance={{
                        variables: {
                            colorPrimary: '#f97316',
                            colorBackground: 'transparent',
                            colorText: '#f8fafc',
                        },
                        elements: {
                            rootBox: { width: '100%' },
                            cardBox: {
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                border: 'none',
                                width: '100%',
                            },
                            card: {
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                border: 'none',
                                width: '100%',
                            },
                            
                            navbarMobileMenuRow: {
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                            },
                            scrollBox: {
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                border: 'none',
                            },
                        },
                    }}
                />
            </Card>
        </div>
    );
};

export default Profile;