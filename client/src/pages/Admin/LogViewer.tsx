import React, { useState } from 'react';
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type LogLevel = "info" | "warn" | "error";

const LEVEL_STYLES: Record<LogLevel, string> = {
    error: 'bg-red-500/20 text-red-400',
    warn: 'bg-amber-500/20 text-amber-400',
    info: 'bg-slate-500/20 text-slate-400',
};

const LogViewer: React.FC = () => {
    const [level, setLevel] = useState<LogLevel | "all">("all");

    const { results: logs, status, loadMore } = usePaginatedQuery(
        api.logs.getRecentLogs,
        level === "all" ? {} : { level },
        { initialNumItems: 20 }
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    Application Logs
                </h3>
                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LogLevel | "all")}
                    className="bg-slate-800 border border-white/[0.07] text-sm text-white rounded-md px-3 py-1.5"
                >
                    <option value="all">All levels</option>
                    <option value="error">Error</option>
                    <option value="warn">Warn</option>
                    <option value="info">Info</option>
                </select>
            </div>

            {status === "LoadingFirstPage" ? (
                <div className="text-slate-400 text-sm">Loading logs...</div>
            ) : logs.length === 0 ? (
                <div className="text-slate-500 text-sm">No logs found.</div>
            ) : (
                <div className="grid gap-2">
                    {logs.map((log) => (
                        <Card key={log._id} className="p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${LEVEL_STYLES[log.level]}`}>
                                        {log.level.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-slate-500 shrink-0">{log.source}</span>
                                    <span className="text-sm text-white truncate">{log.message}</span>
                                </div>
                                <span className="text-xs text-slate-500 shrink-0">
                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            {log.metadata && (
                                <pre className="mt-2 text-xs text-slate-400 bg-black/20 rounded p-2 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                            )}
                        </Card>
                    ))}
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

export default LogViewer;
