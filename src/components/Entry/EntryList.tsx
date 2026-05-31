'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getBadgeClass } from '@/lib/colors';

export interface EntrySummary {
    id: string;
    date: string;
    title: string;
    tag: string;
    color: string;
    featured: boolean;
    experienceName?: string;
}

interface Props {
    items: EntrySummary[];
    deleteAction: (id: string) => Promise<void>;
}

function formatDate(iso: string, locale: string) {
    return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function EntryList({ items, deleteAction }: Props) {
    const [toDelete, setToDelete] = useState<EntrySummary | null>(null);
    const [isPending, startTransition] = useTransition();
    const t = useTranslations('Entries');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

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
                {t('empty')}
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
                            <th className="p-4 font-semibold text-text-muted">{t('colDate')}</th>
                            <th className="p-4 font-semibold text-text-muted">{t('colTitle')}</th>
                            <th className="p-4 font-semibold text-text-muted">{t('colExperience')}</th>
                            <th className="p-4 font-semibold text-text-muted">{t('colTag')}</th>
                            <th className="p-4 font-semibold text-text-muted text-right">{tCommon('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-border-light hover:bg-surface-elevated/50">
                                <td className="p-4 font-medium text-text-primary whitespace-nowrap">{formatDate(item.date, locale)}</td>
                                <td className="p-4 text-text-secondary">
                                    <span className="inline-flex items-center gap-2">
                                        {item.featured && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" aria-label={tCommon('featuredAriaLabel')} />}
                                        {item.title}
                                    </span>
                                </td>
                                <td className="p-4 text-text-muted text-sm">{item.experienceName || '—'}</td>
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
                                        {tCommon('edit')}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setToDelete(item)}
                                        className="inline-block px-3 py-2 rounded-lg text-danger-text hover:text-danger-text-hover hover:bg-danger-bg-hover font-medium transition-colors cursor-pointer"
                                    >
                                        {tCommon('delete')}
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
                                <div className="text-xs text-text-muted mb-0.5">{formatDate(item.date, locale)}</div>
                                <div className="font-semibold text-text-primary inline-flex items-center gap-1.5">
                                    {item.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-label={tCommon('featuredAriaLabel')} />}
                                    {item.title}
                                </div>
                                {item.experienceName && (
                                    <div className="text-text-muted text-sm">{item.experienceName}</div>
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
                                {tCommon('edit')}
                            </Link>
                            <button
                                type="button"
                                onClick={() => setToDelete(item)}
                                className="flex-1 px-4 py-2 rounded-lg text-danger-text hover:text-danger-text-hover hover:bg-danger-bg-hover font-medium transition-colors cursor-pointer"
                            >
                                {tCommon('delete')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!toDelete}
                title={t('deleteTitle')}
                description={
                    toDelete
                        ? t.rich('deleteDescription', {
                              title: toDelete.title,
                              strong: (chunks) => <span className="font-semibold">{chunks}</span>,
                          })
                        : null
                }
                confirmLabel={tCommon('delete')}
                pendingLabel={tCommon('deleting')}
                danger
                pending={isPending}
                onConfirm={confirmDelete}
                onClose={() => !isPending && setToDelete(null)}
            />
        </>
    );
}
