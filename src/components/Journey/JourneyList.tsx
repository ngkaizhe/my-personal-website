'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { getBadgeClass } from '@/lib/colors';

export interface JourneySummary {
    id: string;
    year: string;
    title: string;
    tag: string;
    color: string;
}

interface Props {
    items: JourneySummary[];
    deleteAction: (id: string) => Promise<void>;
}

export default function JourneyList({ items, deleteAction }: Props) {
    const [toDelete, setToDelete] = useState<JourneySummary | null>(null);
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
                No journey items found. Add one to get started!
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
                            <th className="p-4 font-semibold text-text-muted">Year</th>
                            <th className="p-4 font-semibold text-text-muted">Title</th>
                            <th className="p-4 font-semibold text-text-muted">Tag</th>
                            <th className="p-4 font-semibold text-text-muted text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-border-light hover:bg-surface-elevated/50">
                                <td className="p-4 font-medium text-text-primary">{item.year}</td>
                                <td className="p-4 text-text-secondary">{item.title}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(item.color)}`}>
                                        {item.tag}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <Link
                                        href={`/dashboard/journeys/${item.id}`}
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
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <div className="font-bold text-lg text-text-primary">{item.year}</div>
                                <div className="text-text-secondary text-sm">{item.title}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getBadgeClass(item.color)}`}>
                                {item.tag}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border-light">
                            <Link
                                href={`/dashboard/journeys/${item.id}`}
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
                            Delete journey?
                        </h2>
                        <p className="text-text-secondary mb-6">
                            Are you sure you want to delete <span className="font-semibold">{toDelete.year} — {toDelete.title}</span>? This action cannot be undone.
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
