'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { getBadgeClass } from '@/lib/colors';

export interface EntrySummary {
    id: string;
    date: string;
    title: string;
    tag: string;
    color: string;
    employerName?: string;
}

interface Props {
    items: EntrySummary[];
    deleteAction: (id: string) => Promise<void>;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function EntryList({ items, deleteAction }: Props) {
    const [toDelete, setToDelete] = useState<EntrySummary | null>(null);
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
                No entries found. Add one to get started!
            </div>
        );
    }

    return (
        <>
            {/* Desktop: table */}
            <div className="hidden md:block bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-elevated border-b border-border-light">
                            <th className="p-4 font-semibold text-text-muted">Date</th>
                            <th className="p-4 font-semibold text-text-muted">Title</th>
                            <th className="p-4 font-semibold text-text-muted">Employer</th>
                            <th className="p-4 font-semibold text-text-muted">Tag</th>
                            <th className="p-4 font-semibold text-text-muted text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-border-light hover:bg-surface-elevated/50">
                                <td className="p-4 font-medium text-text-primary whitespace-nowrap">{formatDate(item.date)}</td>
                                <td className="p-4 text-text-secondary">{item.title}</td>
                                <td className="p-4 text-text-muted text-sm">{item.employerName || '—'}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(item.color)}`}>
                                        {item.tag}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                    <Link
                                        href={`/dashboard/entries/${item.id}`}
                                        className="inline-block px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setToDelete(item)}
                                        className="inline-block px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="bg-surface rounded-xl shadow-sm border border-border p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                                <div className="text-xs text-text-muted mb-0.5">{formatDate(item.date)}</div>
                                <div className="font-semibold text-text-primary">{item.title}</div>
                                {item.employerName && (
                                    <div className="text-text-muted text-sm">{item.employerName}</div>
                                )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getBadgeClass(item.color)}`}>
                                {item.tag}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border-light">
                            <Link
                                href={`/dashboard/entries/${item.id}`}
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

            {/* Confirm dialog */}
            {toDelete && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-title"
                >
                    <div
                        className="absolute inset-0 bg-overlay backdrop-blur-sm"
                        onClick={() => !isPending && setToDelete(null)}
                    />
                    <div className="relative bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
                        <button
                            onClick={() => setToDelete(null)}
                            disabled={isPending}
                            className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-primary"
                            aria-label="Cancel"
                        >
                            <X size={20} />
                        </button>
                        <h2 id="delete-title" className="text-xl font-bold text-text-primary mb-2">
                            Delete entry?
                        </h2>
                        <p className="text-text-secondary mb-6">
                            Are you sure you want to delete <span className="font-semibold">{toDelete.title}</span>? This action cannot be undone.
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
