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
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Progress Photos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Keep a visual timeline of your progress.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700">
                                        Photo URL
                                    </label>
                                    <input
                                        type="url"
                                        id="photoUrl"
                                        placeholder="https://example.com/my-photo.jpg"
                                        required
                                        value={photoUrl}
                                        onChange={(e) => setPhotoUrl(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Paste a link to your hosted image.
                                    </p>
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                        Notes
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="notes"
                                            rows={3}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-6 flex justify-end">
                                    <button
                                        type="submit"
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    <div key={log.id} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="aspect-w-3 aspect-h-4 mb-4">
                                <img
                                    src={log.photo_url}
                                    alt={`Progress on ${log.date}`}
                                    className="object-cover shadow-lg rounded-lg w-full h-64"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
                                    }}
                                />
                            </div>
                            <div className="mt-4">
                                <h4 className="text-lg font-bold text-gray-900">
                                    {new Date(log.date).toLocaleDateString()}
                                </h4>
                                <p className="mt-1 text-sm text-gray-500">{log.notes}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProgressPhotos;
