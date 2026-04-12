'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { EmployerSummary } from '@/app/dashboard/employers/actions';
import { getBadgeClass } from '@/lib/colors';

interface Props {
    items: EmployerSummary[];
    deleteAction: (id: string) => Promise<void>;
}

function formatRange(start: string, end: string | null) {
    const s = new Date(start).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    const e = end ? new Date(end).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Present';
    return `${s} – ${e}`;
}

export default function EmployerList({ items, deleteAction }: Props) {
    const [toDelete, setToDelete] = useState<EmployerSummary | null>(null);
    const [isPending, startTransition] = useTransition();

    const confirmDelete = () => {
        if (!toDelete) return;
        const id = toDelete.id;
        startTransition(async () => {
            await deleteAction(id);
            setToDelete(null);
        });
    };

    if (items.length === 0) {
        return (
            <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center text-text-muted">
                No employers yet. Add one to start grouping your entries.
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-surface rounded-xl shadow-sm border border-border p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                                <h3 className="font-bold text-text-primary text-lg">{item.name}</h3>
                                <p className="text-text-secondary text-sm">{item.role}</p>
                                <p className="text-text-muted text-xs mt-1">{formatRange(item.startDate, item.endDate)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getBadgeClass(item.color)}`}>
                                {item.entryCount} {item.entryCount === 1 ? 'entry' : 'entries'}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border-light">
                            <Link
                                href={`/dashboard/employers/${item.id}`}
                                className="flex-1 text-center px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                            >
                                Edit
                            </Link>
                            <button
                                type="button"
                                onClick={() => setToDelete(item)}
                                className="flex-1 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {toDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-emp-title">
                    <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => !isPending && setToDelete(null)} />
                    <div className="relative bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
                        <button
                            onClick={() => setToDelete(null)}
                            disabled={isPending}
                            className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-primary"
                            aria-label="Cancel"
                        >
                            <X size={20} />
                        </button>
                        <h2 id="delete-emp-title" className="text-xl font-bold text-text-primary mb-2">Delete employer?</h2>
                        <p className="text-text-secondary mb-6">
                            Are you sure you want to delete <span className="font-semibold">{toDelete.name}</span>? Entries linked to it will be kept but unlinked.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setToDelete(null)}
                                disabled={isPending}
                                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-elevated font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isPending}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
