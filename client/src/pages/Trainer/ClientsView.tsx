import React from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

const ClientsView: React.FC = () => {
    const clients = useQuery((api as any).users.getMyClients);
    const inviteCodes = useQuery((api as any).inviteCodes.getMyInviteCodes);
    const generateInvite = useMutation((api as any).inviteCodes.generateInviteCode);

    if (clients === undefined) return <div className="text-white">Loading clients...</div>;

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Client Management</h2>
                    <p className="text-slate-400">View and manage your assigned clients</p>
                </div>
                <Button onClick={() => generateInvite({})}>Generate Invite Code</Button>
            </header>

            {inviteCodes && inviteCodes.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Active Invite Codes</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {inviteCodes.map((code: any) => (
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
                <h3 className="text-xl font-semibold text-white">Your Clients</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client: any) => (
                        <Link to={`/clients/${client._id}`} key={client._id}>
                            <Card className="p-4 hover:border-primary/50 transition-colors group">
                                <p className="font-bold text-white group-hover:text-primary transition-colors">{client.name}</p>
                                <p className="text-sm text-slate-400">{client.email}</p>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-xs text-slate-500">View detailed stats →</span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                    {clients.length === 0 && (
                        <p className="text-slate-500 italic">No clients assigned yet. Share an invite code to get started.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ClientsView;
