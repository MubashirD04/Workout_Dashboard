import React from 'react';
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const AdminPanel: React.FC = () => {
    const { results: users, status, loadMore } = usePaginatedQuery(
        api.users.listAllUsers,
        {},
        { initialNumItems: 20 }
    );
    const setRole = useMutation((api as any).users.setUserRole);

    if (status === "LoadingFirstPage") return <div className="text-white">Loading users...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
                <p className="text-slate-400">Manage users and system roles</p>
            </header>

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
        </div>
    );
};

export default AdminPanel;
