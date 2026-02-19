import React, { useState } from 'react';
import { photosApi } from '../api/trackingApi';
import { useFetch } from '../hooks/useFetch';
import { getCurrentDate, formatDate } from '../utils/dateUtils';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface PhotoLog {
    id: number;
    date: string;
    photo_url: string;
    notes: string;
}

const ProgressPhotos: React.FC = () => {
    const { data, refresh: refreshLogs } = useFetch(photosApi.getAll);
    const logs = data || [];

    const [date, setDate] = useState(getCurrentDate());
    const [photoUrl, setPhotoUrl] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await photosApi.create({
                date,
                photo_url: photoUrl,
                notes,
            });

            refreshLogs();
            setPhotoUrl('');
            setNotes('');
            alert('Photo Entry Logged!');
        } catch (error) {
            console.error('Error logging photo:', error);
            alert('Failed to log photo entry');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 sm:p-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Progress Photos</h3>
                        <p className="text-sm text-slate-400">
                            Keep a visual timeline of your progress.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <Input
                                        label="Date"
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <Input
                                        label="Photo URL"
                                        type="url"
                                        placeholder="https://example.com/my-photo.jpg"
                                        required
                                        value={photoUrl}
                                        onChange={(e) => setPhotoUrl(e.target.value)}
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        Paste a link to your hosted image.
                                    </p>
                                </div>

                                <div className="col-span-6">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="bg-slate-900 border border-white/10 text-white shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm rounded-lg p-2 resize-none"
                                        placeholder="Add notes about your progress..."
                                    />
                                </div>

                                <div className="col-span-6 flex justify-end pt-4">
                                    <Button type="submit" className="px-6">
                                        Add Entry
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(logs as PhotoLog[]).map((log) => (
                    <Card key={log.id} className="overflow-hidden group p-0">
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
                                    {formatDate(log.date)}
                                </h4>
                                <p className="mt-1 text-sm text-slate-400 italic">{log.notes}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ProgressPhotos;
