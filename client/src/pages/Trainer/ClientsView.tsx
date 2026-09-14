import React, { useState } from 'react';
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../utils/errorUtils';
import { useCurrentUser } from '../../hooks/useCurrentUser';

type Scope = "mine" | "all";

const ClientsView: React.FC = () => {
    const { isAdmin } = useCurrentUser();
    // Admins can also browse every client; "mine" is only those assigned to them.
    const [scope, setScope] = useState<Scope>("mine");
    const effectiveScope: Scope = isAdmin ? scope : "mine";

    const { results: clients, status, loadMore } = usePaginatedQuery(
        api.users.getMyClients,
        { scope: effectiveScope },
        { initialNumItems: 24 }
    );
    // Trainer names for the "All clients" view — listTrainers is admin-only.
    const trainers = useQuery(api.users.listTrainers, isAdmin && effectiveScope === "all" ? {} : "skip");
    const trainerNames = new Map((trainers ?? []).map((t) => [t._id, t.name]));
    const inviteCodes = useQuery(api.inviteCodes.getMyInviteCodes);
    const generateInvite = useMutation(api.inviteCodes.generateInviteCode);

    const [generating, setGenerating] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    const handleGenerateInvite = async () => {
        setGenerating(true);
        setInviteError(null);
        try {
            await generateInvite({});
        } catch (err) {
            setInviteError(getErrorMessage(err, "Couldn't generate an invite code. Please try again."));
        } finally {
            setGenerating(false);
        }
    };

    if (status === "LoadingFirstPage") return <div className="text-white">Loading clients...</div>;

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Client Management</h2>
                    <p className="text-slate-400">View and manage your assigned clients</p>
                </div>
                <Button onClick={handleGenerateInvite} disabled={generating}>Generate Invite Code</Button>
            </header>

            {inviteError && (
                <div role="alert" className="rounded-md bg-red-500/10 ring-1 ring-red-500/30 px-4 py-3 text-sm text-red-300">
                    {inviteError}
                </div>
            )}

            {inviteCodes && inviteCodes.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Active Invite Codes</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {inviteCodes.map((code) => (
                            <Card key={code._id} className="p-4 min-w-[200px] border-primary/20 bg-primary/5">
                                <p className="text-xs text-slate-400 mb-1">Invite Code</p>
                                <p className="text-2xl font-mono font-bold text-primary">{code.code}</p>
                                <p className="text-[10px] text-slate-500 mt-2">
                                    Expires: {new Date(code.expiresAt).toLocaleDateString()}
                                </p>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">
                        {effectiveScope === "all" ? "All Clients" : "Your Clients"}
                    </h3>
                    {isAdmin && (
                        <div role="group" aria-label="Which clients to show" className="inline-flex rounded-md border border-white/[0.07] overflow-hidden text-xs">
                            {(["mine", "all"] as const).map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={scope === value}
                                    onClick={() => setScope(value)}
                                    className={`px-3 py-1.5 transition-colors ${scope === value ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                    {value === "mine" ? "My clients" : "All clients"}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client) => (
                        <Link to={`/clients/${client._id}`} key={client._id}>
                            <Card className="p-4 hover:border-primary/50 transition-colors group">
                                <p className="font-bold text-white group-hover:text-primary transition-colors">{client.name}</p>
                                <p className="text-sm text-slate-400">{client.email}</p>
                                <div className="mt-4 flex justify-between items-center gap-2">
                                    <span className="text-xs text-slate-500">View detailed stats →</span>
                                    {effectiveScope === "all" && (
                                        <span className="text-xs text-slate-500 truncate">
                                            {client.trainerId ? `Trainer: ${trainerNames.get(client.trainerId) ?? '…'}` : 'Unassigned'}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    ))}
                    {clients.length === 0 && (
                        <p className="text-slate-500 italic">
                            {effectiveScope === "all"
                                ? "No clients yet."
                                : "No clients assigned yet. Share an invite code to get started."}
                        </p>
                    )}
                </div>
                {status === "CanLoadMore" && (
                    <Button onClick={() => loadMore(24)} variant="secondary" className="w-full">
                        Load More
                    </Button>
                )}
                {status === "LoadingMore" && (
                    <div className="text-center py-4 text-slate-500">Loading more...</div>
                )}
            </section>
        </div>
    );
};

export default ClientsView;
