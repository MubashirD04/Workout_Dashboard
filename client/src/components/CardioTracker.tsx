import React, { useState, useEffect } from 'react';

interface CardioLog {
    id: number;
    date: string;
    type: string;
    distance: number;
    duration: number;
    notes: string;
}

const CardioTracker: React.FC = () => {
    const [logs, setLogs] = useState<CardioLog[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('Run');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');

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

    const calculatePace = (dist: number, dur: number) => {
        if (!dist || !dur) return 0;
        return (dur / dist).toFixed(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/cardio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    type,
                    distance: parseFloat(distance),
                    duration: parseInt(duration),
                    notes,
                }),
            });

            if (response.ok) {
                fetchLogs();
                setDistance('');
                setDuration('');
                setNotes('');
                alert('Cardio session logged!');
            } else {
                alert('Failed to log session');
            }
        } catch (error) {
            console.error('Error logging cardio:', error);
            alert('Error logging session');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/cardio/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setLogs(logs.filter((log) => log.id !== id));
            }
        } catch (error) {
            console.error('Error deleting log:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-2">Track Cardio</h3>
                        <p className="text-sm text-slate-400">
                            Log your running, cycling, swimming, or other cardio activities.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        id="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-400 mb-1">
                                        Type
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    >
                                        <option>Run</option>
                                        <option>Cycle</option>
                                        <option>Swim</option>
                                        <option>Walk</option>
                                        <option>Hike</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="distance" className="block text-sm font-medium text-slate-400 mb-1">
                                        Distance (km)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="distance"
                                        id="distance"
                                        required
                                        value={distance}
                                        onChange={(e) => setDistance(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="duration" className="block text-sm font-medium text-slate-400 mb-1">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        name="duration"
                                        id="duration"
                                        required
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-slate-400 mb-1">
                                        Notes
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="bg-slate-900 border border-white/10 text-white shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm rounded-lg p-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-glow text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                                >
                                    Log Cardio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Stats
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Pace
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Notes
                                </th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Delete</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                        {new Date(log.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {log.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {log.distance} km / {log.duration} min
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {calculatePace(log.distance, log.duration)} min/km
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate italic">
                                        {log.notes}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CardioTracker;
