import React, { useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getErrorMessage } from '../../utils/errorUtils';
import LogViewer from './LogViewer';
import AuditLogViewer from './AuditLogViewer';
import DeleteUserDialog from './DeleteUserDialog';

type Role = "admin" | "trainer" | "client";

// Route guard — the sidebar hides the Admin link for non-admins, but the URL is
// still reachable directly. Checking role here (before any admin-only query
// mounts) redirects instead of letting requireAdmin throw into the error boundary.
const AdminPanel: React.FC = () => {
    const { user, isAdmin, isLoading } = useCurrentUser();

    if (isLoading) return <div className="text-white">Loading...</div>;
    if (!isAdmin || !user) return <Navigate to="/" replace />;

    return <AdminPanelContent currentUserId={user._id} />;
};

const AdminPanelContent: React.FC<{ currentUserId: Id<"users"> }> = ({ currentUserId }) => {
    const { results: users, status, loadMore } = usePaginatedQuery(
        api.users.listAllUsers,
        {},
        { initialNumItems: 20 }
    );
    const setRole = useMutation(api.users.setUserRole);
    const pendingRequests = useQuery(api.users.listPendingTrainerRequests);
    const approveRequest = useMutation(api.users.approveTrainerRequest);
    const denyRequest = useMutation(api.users.denyTrainerRequest);
    const trainers = useQuery(api.users.listTrainers);
    const assignTrainer = useMutation(api.users.assignClientToTrainer);
    const deleteUser = useMutation(api.users.deleteUser);

    const [error, setError] = useState<string | null>(null);
    const [busyUserId, setBusyUserId] = useState<Id<"users"> | null>(null);

    const run = async (targetUserId: Id<"users">, action: () => Promise<unknown>) => {
        setError(null);
        setBusyUserId(targetUserId);
        try {
            await action();
        } catch (err) {
            setError(getErrorMessage(err, "That change couldn't be saved. Please try again."));
        } finally {
            setBusyUserId(null);
        }
    };

    const changeRole = (targetUserId: Id<"users">, role: Role) =>
        run(targetUserId, () => setRole({ targetUserId, role }));

    // Empty string = unassign. trainerId is omitted rather than sent as
    // undefined, which is how assignClientToTrainer expects an unassign.
    const changeTrainer = (clientId: Id<"users">, trainerId: string) =>
        run(clientId, () => assignTrainer(
            trainerId ? { clientId, trainerId: trainerId as Id<"users"> } : { clientId }
        ));

    // Delete has its own dialog-scoped error/busy state so failures show in
    // the dialog rather than the page banner behind the overlay.
    const [pendingDelete, setPendingDelete] = useState<Doc<"users"> | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const closeDeleteDialog = useCallback(() => {
        setPendingDelete(null);
        setDeleteError(null);
    }, []);

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteUser({ targetUserId: pendingDelete._id });
            setPendingDelete(null);
        } catch (err) {
            setDeleteError(getErrorMessage(err, "Couldn't delete this user. Please try again."));
        } finally {
            setDeleting(false);
        }
    };

    const trainerNames = new Map((trainers ?? []).map((t) => [t._id, t.name]));

    if (status === "LoadingFirstPage") return <div className="text-white">Loading users...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
                <p className="text-slate-400">Manage users and system roles</p>
            </header>

            {error && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-md bg-red-500/10 ring-1 ring-red-500/30 px-4 py-3 text-sm text-red-300">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-300/70 hover:text-red-200" aria-label="Dismiss error">
                        ✕
                    </button>
                </div>
            )}

            {pendingRequests && pendingRequests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-amber-400/90 uppercase tracking-wide">
                        Trainer requests ({pendingRequests.length})
                    </h3>
                    <div className="grid gap-3">
                        {pendingRequests.map((req) => (
                            <Card key={req._id} className="p-4 flex items-center justify-between ring-1 ring-amber-500/25">
                                <div>
                                    <p className="font-bold text-white">{req.name}</p>
                                    <p className="text-sm text-slate-400">{req.email}</p>
                                    {req.trainerRequestedAt !== undefined && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Requested {new Date(req.trainerRequestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        disabled={busyUserId === req._id}
                                        onClick={() => run(req._id, () => approveRequest({ targetUserId: req._id }))}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={busyUserId === req._id}
                                        onClick={() => run(req._id, () => denyRequest({ targetUserId: req._id }))}
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
                {users.map((user) => (
                    <Card key={user._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="font-bold text-white">
                                {user.name}
                                {user._id === currentUserId && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                            </p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                            <span className={`text-xs px-2 py-1 rounded ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                user.role === 'trainer' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-slate-500/20 text-slate-400'
                                }`}>
                                {user.role.toUpperCase()}
                            </span>
                            {user.role === 'client' && user.trainerId && (
                                <span className="ml-2 text-xs text-slate-500">
                                    Trainer: {trainerNames.get(user.trainerId) ?? 'Unknown'}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {user.role === 'client' && (
                                <select
                                    aria-label={`Trainer for ${user.name}`}
                                    value={user.trainerId ?? ''}
                                    disabled={busyUserId === user._id || trainers === undefined}
                                    onChange={(e) => changeTrainer(user._id, e.target.value)}
                                    className="bg-slate-800 border border-white/[0.07] text-xs text-white rounded-md px-2 py-1.5 disabled:opacity-50"
                                >
                                    <option value="">No trainer</option>
                                    {user.trainerId && !trainerNames.has(user.trainerId) && (
                                        <option value={user.trainerId}>Unknown trainer</option>
                                    )}
                                    {trainers?.map((t) => (
                                        <option key={t._id} value={t._id}>
                                            {t.name}{t.role === 'admin' ? ' (admin)' : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {user.role !== 'admin' && (
                                <Button size="sm" disabled={busyUserId === user._id} onClick={() => changeRole(user._id, 'admin')}>
                                    Make Admin
                                </Button>
                            )}
                            {user.role !== 'trainer' && (
                                <Button size="sm" disabled={busyUserId === user._id} onClick={() => changeRole(user._id, 'trainer')}>
                                    Make Trainer
                                </Button>
                            )}
                            {user.role !== 'client' && (
                                <Button size="sm" disabled={busyUserId === user._id} onClick={() => changeRole(user._id, 'client')}>
                                    Make Client
                                </Button>
                            )}
                            {user._id !== currentUserId && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    disabled={busyUserId === user._id}
                                    onClick={() => { setDeleteError(null); setPendingDelete(user); }}
                                >
                                    Delete
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

            {/* Audit log and application logs each get their own boundary, so a
                failure in one leaves user management and the other log working. */}
            <ErrorBoundary
                fallback={(retry) => (
                    <Card className="p-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-400">
                            The audit log couldn't be loaded. If the backend was recently changed, make sure it has been deployed.
                        </p>
                        <Button size="sm" variant="secondary" onClick={retry}>Retry</Button>
                    </Card>
                )}
            >
                <AuditLogViewer />
            </ErrorBoundary>

            {/* Isolated so a log-query failure (e.g. logs.ts not yet deployed)
                doesn't take user/role management down with it. */}
            <ErrorBoundary
                fallback={(retry) => (
                    <Card className="p-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-400">
                            Application logs couldn't be loaded. If the backend was recently changed, make sure it has been deployed.
                        </p>
                        <Button size="sm" variant="secondary" onClick={retry}>Retry</Button>
                    </Card>
                )}
            >
                <LogViewer />
            </ErrorBoundary>

            {pendingDelete && (
                <DeleteUserDialog
                    user={pendingDelete}
                    deleting={deleting}
                    error={deleteError}
                    onConfirm={confirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}
        </div>
    );
};

export default AdminPanel;
