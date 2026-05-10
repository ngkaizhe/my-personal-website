'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Briefcase, GraduationCap, Rocket, HeartHandshake, Palmtree } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExperienceSummary } from '@/app/dashboard/experiences/actions';
import type { ExperienceType } from '@/lib/types';
import { getBadgeClass } from '@/lib/colors';

const TYPE_META: Record<ExperienceType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    JOB: { label: 'Job', Icon: Briefcase },
    EDUCATION: { label: 'Education', Icon: GraduationCap },
    PROJECT: { label: 'Project', Icon: Rocket },
    VOLUNTEER: { label: 'Volunteer', Icon: HeartHandshake },
    BREAK: { label: 'Break', Icon: Palmtree },
};

interface Props {
    items: ExperienceSummary[];
    deleteAction: (id: string) => Promise<void>;
}

function formatRange(start: string, end: string | null) {
    const s = new Date(start).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    const e = end ? new Date(end).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Present';
    return `${s} – ${e}`;
}

export default function ExperienceList({ items, deleteAction }: Props) {
    const [toDelete, setToDelete] = useState<ExperienceSummary | null>(null);
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
                No experiences yet. Add one to start grouping your entries.
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => {
                    const meta = TYPE_META[item.type];
                    const TypeIcon = meta.Icon;
                    return (
                    <div key={item.id} className="bg-surface rounded-xl shadow-sm border border-border p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex items-start gap-3">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-surface-elevated border border-border-light flex items-center justify-center">
                                    <TypeIcon className="w-5 h-5 text-text-muted" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-medium text-text-faint uppercase tracking-wide mb-0.5">{meta.label}</div>
                                    <h3 className="font-bold text-text-primary text-lg">{item.organization}</h3>
                                    {item.role && <p className="text-text-secondary text-sm">{item.role}</p>}
                                    <p className="text-text-muted text-xs mt-1">{formatRange(item.startDate, item.endDate)}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getBadgeClass(item.color)}`}>
                                {item.entryCount} {item.entryCount === 1 ? 'entry' : 'entries'}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border-light">
                            <Link
                                href={`/dashboard/experiences/${item.id}`}
                                className="flex-1 text-center px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                            >
                                Edit
                            </Link>
                            <button
                                type="button"
                                onClick={() => setToDelete(item)}
                                className="flex-1 px-4 py-2 rounded-lg text-danger-text hover:text-danger-text-hover hover:bg-danger-bg-hover font-medium transition-colors cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    );
                })}
            </div>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete experience?"
                description={
                    toDelete ? (
                        <>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">{toDelete.organization}</span>? Entries linked
                            to it will be kept but unlinked.
                        </>
                    ) : null
                }
                confirmLabel="Delete"
                pendingLabel="Deleting…"
                danger
                pending={isPending}
                onConfirm={confirmDelete}
                onClose={() => !isPending && setToDelete(null)}
            />
        </>
    );
}
