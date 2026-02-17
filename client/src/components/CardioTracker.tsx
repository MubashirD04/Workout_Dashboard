import React, { useState, useEffect } from 'react';
import CardioProgressChart from './CardioProgressChart';

interface CardioLog {
    id: number;
    date: string;
    type: string;
    distance: number;
    duration: number;
    notes: string;
    time: string | null;
}

const CardioTracker: React.FC = () => {
    const [logs, setLogs] = useState<CardioLog[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });
    const [type, setType] = useState('Run');
    const [distance, setDistance] = useState<number | string>('');
    const [duration, setDuration] = useState<number | string>('');
    const [notes, setNotes] = useState('');

    // UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingLogId, setEditingLogId] = useState<number | null>(null);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

    const cardioTypes = ["Run", "Cycle", "Swim", "Walk", "Hike", "Rowing", "Elliptical", "Other"];
    const suggestedTimes = [
        "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
    ];

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/cardio');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching cardio logs:', error);
        }
    };

    const handleSave = async () => {
        if (!date || !type || !distance || !duration) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const method = editingLogId ? 'PUT' : 'POST';
            const url = editingLogId
                ? `http://localhost:5000/api/cardio/${editingLogId}`
                : 'http://localhost:5000/api/cardio';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    type,
                    distance: parseFloat(String(distance)),
                    duration: parseInt(String(duration)),
                    notes,
                    time: time || null,
                }),
            });

            if (response.ok) {
                fetchLogs();
                resetForm();
                alert(editingLogId ? 'Session updated!' : 'Session logged!');
            } else {
                alert('Failed to save session');
            }
        } catch (error) {
            console.error('Error saving cardio:', error);
        }
    };

    const resetForm = () => {
        setEditingLogId(null);
        setType('Run');
        setDistance('');
        setDuration('');
        setNotes('');
        setIsExpanded(false);
        setDate(new Date().toISOString().split('T')[0]);
        const now = new Date();
        setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };

    const loadLogForEdit = async (log: CardioLog) => {
        setEditingLogId(log.id);
        setIsExpanded(true);

        // Handle date formatting
        const formattedDate = log.date.split('T')[0];
        setDate(formattedDate);
        setTime(log.time ? log.time.slice(0, 5) : '');
        setType(log.type);
        setDistance(log.distance);
        setDuration(log.duration);
        setNotes(log.notes || '');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/cardio/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setLogs(logs.filter((log) => log.id !== id));
                if (editingLogId === id) resetForm();
            }
        } catch (error) {
            console.error('Error deleting log:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const parts = dateString.split('T')[0].split('-');
        if (parts.length !== 3) return dateString;
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const d = new Date(year, month, day);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const calculatePace = (dist: number, dur: number) => {
        if (!dist || !dur) return "0.00";
        return (dur / dist).toFixed(2);
    };

    return (
        <div className="space-y-6">
            {/* The Tracker Logger */}
            <div className="glass-card p-6 sm:p-8">
                <div
                    className="flex justify-between items-center cursor-pointer relative z-30"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4 group/arrow">
                        <div className={`p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover/arrow:bg-primary group-hover/arrow:text-white shadow-glow-sm group-active/arrow:scale-90 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                                {editingLogId ? 'Edit Cardio Session' : 'Track Cardio'}
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">
                                {editingLogId ? 'Modify your session details.' : 'Every mile counts. Log your progress.'}
                            </p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-6 transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                        <div className="flex flex-col items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 w-full text-center">Date</label>
                            <input
                                type="date"
                                value={date}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none hover:border-primary/50 transition-colors text-center"
                            />
                        </div>
                        <div className="flex flex-col items-center relative z-50">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 w-full text-center">Time</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={time}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={() => setIsTimeDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsTimeDropdownOpen(false), 200)}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none hover:border-primary/50 transition-colors w-24 uppercase text-center relative z-20"
                                />
                                {isTimeDropdownOpen && (
                                    <div className="absolute z-[100] w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-2xl max-h-40 overflow-y-auto custom-scrollbar">
                                        {suggestedTimes.map((t, idx) => (
                                            <div
                                                key={idx}
                                                className="px-3 py-1.5 hover:bg-primary hover:text-white cursor-pointer text-slate-300 text-[10px] font-bold transition-colors text-center"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTime(t);
                                                    setIsTimeDropdownOpen(false);
                                                }}
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-8' : 'grid-rows-[0fr] opacity-0 mt-0'} overflow-hidden relative z-10`}
                >
                    <div className="min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center md:text-left">Activity Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {cardioTypes.slice(0, 8).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${type === t ? 'bg-primary border-primary text-white shadow-glow-sm' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Distance (km)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={distance}
                                        onChange={(e) => setDistance(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="bg-slate-900 border border-white/10 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Duration (min)</label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="bg-slate-900 border border-white/10 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add session notes (route, intensity, how you felt)..."
                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary mb-4 resize-none h-20 placeholder:text-slate-600"
                            />
                            <div className="flex gap-4">
                                {editingLogId && (
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-lg transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={!distance || Number(distance) <= 0 || !duration || Number(duration) <= 0}
                                    className={`flex-[2] ${editingLogId ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' : 'bg-primary hover:bg-primary-hover'} text-white font-bold py-4 rounded-lg shadow-glow hover:shadow-glow-lg transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none`}
                                >
                                    {editingLogId ? 'Update Session' : 'Save Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cardio Trends Chart */}
            {logs.length > 0 && <CardioProgressChart logs={logs} />}

            {/* History Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 sm:px-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Cardio History</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 sm:px-8 py-4">Date</th>
                                <th className="px-6 sm:px-8 py-4">Type</th>
                                <th className="px-6 sm:px-8 py-4">Distance</th>
                                <th className="px-6 sm:px-8 py-4">Pace</th>
                                <th className="px-6 sm:px-8 py-4">Time</th>
                                <th className="px-6 sm:px-8 py-4">Notes</th>
                                <th className="px-6 sm:px-8 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr
                                    key={log.id}
                                    onClick={() => loadLogForEdit(log)}
                                    className={`hover:bg-white/5 cursor-pointer transition-colors group ${editingLogId === log.id ? 'bg-primary/5' : ''}`}
                                >
                                    <td className="px-6 sm:px-8 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-white">{formatDate(log.date)}</div>
                                        {log.time && <div className="text-[10px] text-primary font-medium">{log.time.slice(0, 5)}</div>}
                                    </td>
                                    <td className="px-6 sm:px-8 py-4 whitespace-nowrap">
                                        <span className="bg-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-6 sm:px-8 py-4 whitespace-nowrap text-sm font-bold text-white">
                                        {log.distance} <span className="text-slate-500 text-[10px]">km</span>
                                    </td>
                                    <td className="px-6 sm:px-8 py-4 whitespace-nowrap text-sm font-bold text-blue-400">
                                        {calculatePace(log.distance, log.duration)} <span className="text-slate-500 text-[10px]">/km</span>
                                    </td>
                                    <td className="px-6 sm:px-8 py-4 whitespace-nowrap text-sm font-bold text-white">
                                        {log.duration} <span className="text-slate-500 text-[10px]">min</span>
                                    </td>
                                    <td className="px-6 sm:px-8 py-4 max-w-xs truncate text-[13px] text-slate-500 italic">
                                        {log.notes || "—"}
                                    </td>
                                    <td className="px-6 sm:px-8 py-4 text-right">
                                        <button
                                            onClick={(e) => handleDelete(e, log.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-red-400/10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                                        No cardio sessions logged yet. Get moving!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CardioTracker;
