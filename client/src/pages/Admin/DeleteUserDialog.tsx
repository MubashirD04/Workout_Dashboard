import React, { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';

interface DeleteUserDialogProps {
    user: { name: string; email: string; role: string };
    deleting: boolean;
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

// Deleting a user is irreversible and also removes their Clerk account, so the
// admin has to type the user's email (or name, for accounts without one) to
// enable the confirm button.
const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ user, deleting, error, onConfirm, onCancel }) => {
    const [typed, setTyped] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const titleId = useId();
    const confirmText = user.email || user.name;
    const matches = typed.trim().toLowerCase() === confirmText.toLowerCase();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !deleting) onCancel();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [deleting, onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => !deleting && onCancel()}
        >
            {/* Plain div with Card's glass-card styling — Card doesn't forward ARIA props or events. */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="glass-card w-full max-w-md p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <h3 id={titleId} className="text-lg font-bold text-white">Delete {user.name}?</h3>
                    <p className="text-sm text-slate-400 mt-2">
                        This permanently deletes their account (including their Clerk sign-in) and all of their
                        workouts, cardio, metrics, nutrition logs, progress photos, AI coach conversations, and
                        invite codes. Any clients assigned to them become unassigned. This can't be undone.
                    </p>
                </div>

                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (matches && !deleting) onConfirm();
                    }}
                >
                    <label className="block space-y-1.5">
                        <span className="text-sm text-slate-300">
                            Type <span className="font-mono text-white">{confirmText}</span> to confirm
                        </span>
                        <input
                            ref={inputRef}
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            disabled={deleting}
                            autoComplete="off"
                            className="bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/60 w-full"
                        />
                    </label>

                    {error && (
                        <p role="alert" className="text-sm text-red-300">{error}</p>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" variant="danger" disabled={!matches || deleting}>
                            {deleting ? 'Deleting...' : 'Delete user'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteUserDialog;
