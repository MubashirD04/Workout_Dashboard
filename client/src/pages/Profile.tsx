import React from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Card } from '../components/ui/Card';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    trainer: 'Trainer',
    client: 'Client',
};

const Profile: React.FC = () => {
    const { user, isLoading } = useCurrentUser();

    const memberSince = user
        ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <div className="space-y-5">
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