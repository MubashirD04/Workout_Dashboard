import React from 'react';
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LogViewer from './LogViewer';

const AdminPanel: React.FC = () => {
    const { results: users, status, loadMore } = usePaginatedQuery(
        api.users.listAllUsers,
        {},
        { initialNumItems: 20 }
    );
    const setRole = useMutation(api.users.setUserRole);
    const pendingRequests = useQuery((api as any).users.listPendingTrainerRequests);
    const denyRequest = useMutation((api as any).users.denyTrainerRequest);

    if (status === "LoadingFirstPage") return <div className="text-white">Loading users...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
                <p className="text-slate-400">Manage users and system roles</p>
            </header>

            {pendingRequests && pendingRequests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-amber-400/90 uppercase tracking-wide">
                        Trainer requests ({pendingRequests.length})
                    </h3>
                    <div className="grid gap-3">
                        {pendingRequests.map((req: any) => (
                            <Card key={req._id} className="p-4 flex items-center justify-between ring-1 ring-amber-500/25">
                                <div>
                                    <p className="font-bold text-white">{req.name}</p>
                                    <p className="text-sm text-slate-400">{req.email}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Requested {new Date(req.trainerRequestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setRole({ targetUserId: req._id, role: 'trainer' })}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => denyRequest({ targetUserId: req._id })}
                                    >
                                        Deny
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {users.map((user: any) => (
                    <Card key={user._id} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                            <span className={`text-xs px-2 py-1 rounded ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                user.role === 'trainer' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-slate-500/20 text-slate-400'
                                }`}>
                                {user.role.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {user.role !== 'admin' && (
                                <Button size="sm" onClick={() => setRole({ targetUserId: user._id, role: 'admin' })}>
                                    Make Admin
                                </Button>
                            )}
                            {user.role !== 'trainer' && (
                                <Button size="sm" onClick={() => setRole({ targetUserId: user._id, role: 'trainer' })}>
                                    Make Trainer
                                </Button>
                            )}
                            {user.role !== 'client' && (
                                <Button size="sm" onClick={() => setRole({ targetUserId: user._id, role: 'client' })}>
                                    Make Client
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
            {status === "CanLoadMore" && (
                <Button onClick={() => loadMore(20)} variant="secondary" className="w-full">
                    Load More
                </Button>
            )}
            {status === "LoadingMore" && (
                <div className="text-center py-4 text-slate-500">Loading more...</div>
            )}

            <LogViewer />
        </div>
    );
};

export default AdminPanel;
