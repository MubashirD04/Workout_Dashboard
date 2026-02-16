import React, { useState, useEffect } from 'react';

interface PhotoLog {
    id: number;
    date: string;
    photo_url: string;
    notes: string;
}

const ProgressPhotos: React.FC = () => {
    const [logs, setLogs] = useState<PhotoLog[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/photos');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching photo logs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    photo_url: photoUrl,
                    notes,
                }),
            });

            if (response.ok) {
                fetchLogs();
                setPhotoUrl('');
                setNotes('');
                alert('Photo Entry Logged!');
            } else {
                alert('Failed to log photo entry');
            }
        } catch (error) {
            console.error('Error logging photo:', error);
            alert('Error logging photo');
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-2">Progress Photos</h3>
                        <p className="text-sm text-slate-400">
                            Keep a visual timeline of your progress.
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
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="photoUrl" className="block text-sm font-medium text-slate-400 mb-1">
                                        Photo URL
                                    </label>
                                    <input
                                        type="url"
                                        id="photoUrl"
                                        placeholder="https://example.com/my-photo.jpg"
                                        required
                                        value={photoUrl}
                                        onChange={(e) => setPhotoUrl(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm rounded-lg p-2"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        Paste a link to your hosted image.
                                    </p>
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-slate-400 mb-1">
                                        Notes
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="notes"
                                            rows={3}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="bg-slate-900 border border-white/10 text-white shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm rounded-lg p-2"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-6 flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-glow text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                                    >
                                        Add Entry
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {logs.map((log) => (
                    <div key={log.id} className="glass-card overflow-hidden group">
                        <div className="p-4">
                            <div className="aspect-w-3 aspect-h-4 mb-4 overflow-hidden rounded-xl">
                                <img
                                    src={log.photo_url}
                                    alt={`Progress on ${log.date}`}
                                    className="object-cover shadow-lg w-full h-64 group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
                                    }}
                                />
                            </div>
                            <div className="mt-4">
                                <h4 className="text-lg font-bold text-primary">
                                    {new Date(log.date).toLocaleDateString()}
                                </h4>
                                <p className="mt-1 text-sm text-slate-400 italic">{log.notes}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProgressPhotos;
