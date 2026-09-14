import React, { useState } from 'react';
import { usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type AuditEntry = FunctionReturnType<typeof api.audit.getRecentAuditLogs>["page"][number];
type Category = "role" | "trainerRequest" | "assignment" | "deletion";

const CATEGORY_OPTIONS: { value: Category | "all"; label: string }[] = [
    { value: "all", label: "All activity" },
    { value: "role", label: "Role changes" },
    { value: "trainerRequest", label: "Trainer requests" },
    { value: "assignment", label: "Trainer assignments" },
    { value: "deletion", label: "Deletions" },
];

const CATEGORY_STYLES: Record<Category, { label: string; className: string }> = {
    role: { label: 'ROLE', className: 'bg-blue-500/20 text-blue-400' },
    trainerRequest: { label: 'REQUEST', className: 'bg-amber-500/20 text-amber-400' },
    assignment: { label: 'ASSIGN', className: 'bg-emerald-500/20 text-emerald-400' },
    deletion: { label: 'DELETE', className: 'bg-red-500/20 text-red-400' },
};

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', trainer: 'Trainer', client: 'Client' };
const roleLabel = (role: unknown) => (typeof role === 'string' ? ROLE_LABELS[role] ?? role : 'unknown');

// Prefer the user's current name; fall back to the name captured when the
// entry was written (targets may since have been deleted or renamed).
function nameOf(entry: AuditEntry, id: unknown, snapshot?: unknown): string {
    if (typeof id === 'string' && entry.names[id]) return entry.names[id] as string;
    if (typeof snapshot === 'string' && snapshot) return snapshot;
    return typeof id === 'string' ? 'a deleted user' : 'Unknown';
}

function describe(entry: AuditEntry): React.ReactNode {
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    const actor = entry.actorId ? nameOf(entry, entry.actorId) : 'System';
    const target = nameOf(entry, entry.targetId, meta.targetName);
    const b = (text: string) => <span className="font-semibold text-white">{text}</span>;

    switch (entry.action) {
        case 'user.create':
            return <>{b(target)} signed up as {b(roleLabel(meta.role))}{meta.bootstrapAdmin ? ' (first user, auto-promoted)' : ''}</>;
        case 'user.setRole':
            return <>{b(actor)} changed {b(target)}'s role: {roleLabel(meta.from)} → {b(roleLabel(meta.to))}</>;
        case 'trainerRequest.approve':
            return <>{b(actor)} approved {b(target)}'s trainer request: Client → {b('Trainer')}</>;
        case 'trainerRequest.submit':
            return <>{b(target)} requested trainer access</>;
        case 'trainerRequest.cancel':
            return <>{b(target)} withdrew their trainer request</>;
        case 'trainerRequest.deny':
            return <>{b(actor)} denied {b(target)}'s trainer request</>;
        case 'user.assignTrainer': {
            const to = meta.to ? nameOf(entry, meta.to) : null;
            const from = meta.from ? nameOf(entry, meta.from) : null;
            if (meta.via === 'inviteCode') {
                return <>{b(target)} joined {b(to ?? 'Unknown')} using an invite code</>;
            }
            if (!to) return <>{b(actor)} unassigned {b(target)} from {b(from ?? 'their trainer')}</>;
            return <>{b(actor)} assigned {b(target)} to {b(to)}{from ? <> (was {from})</> : null}</>;
        }
        case 'user.delete':
            return meta.via === 'clerkWebhook'
                ? <>{b(target)} ({roleLabel(meta.role)}) was deleted in Clerk and removed from the app</>
                : <>{b(actor)} deleted {b(target)} ({roleLabel(meta.role)})</>;
        default:
            return <>{b(actor)} · {entry.action}</>;
    }
}

const AuditLogViewer: React.FC = () => {
    const [category, setCategory] = useState<Category | "all">("all");

    const { results: entries, status, loadMore } = usePaginatedQuery(
        api.audit.getRecentAuditLogs,
        category === "all" ? {} : { category },
        { initialNumItems: 20 }
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Audit Log
                </h3>
                <select
                    aria-label="Filter audit log"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category | "all")}
                    className="bg-slate-800 border border-white/[0.07] text-sm text-white rounded-md px-3 py-1.5"
                >
                    {CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {status === "LoadingFirstPage" ? (
                <div className="text-slate-400 text-sm">Loading audit log...</div>
            ) : entries.length === 0 ? (
                <div className="text-slate-500 text-sm">No audit entries found.</div>
            ) : (
                <div className="grid gap-2">
                    {entries.map((entry) => {
                        const style = entry.category ? CATEGORY_STYLES[entry.category as Category] : undefined;
                        return (
                            <Card key={entry._id} className="p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {style && (
                                            <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${style.className}`}>
                                                {style.label}
                                            </span>
                                        )}
                                        <span className="text-sm text-slate-300 min-w-0">{describe(entry)}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 shrink-0">
                                        {new Date(entry.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

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

export default AuditLogViewer;
