'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Search, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getBadgeClass } from '@/lib/colors';
import { inputClassCompact } from '@/lib/formStyles';

export interface EntrySummary {
    id: string;
    date: string;
    title: string;
    actionVerb?: string;
    tag: string;
    color: string;
    featured: boolean;
    experienceName?: string;
}

interface Props {
    items: EntrySummary[];
    deleteAction: (id: string) => Promise<void>;
    featuredAction: (id: string, featured: boolean) => Promise<void>;
}

function formatDate(iso: string, locale: string) {
    return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function displayTitle(item: EntrySummary) {
    return [item.actionVerb, item.title].filter(Boolean).join(' ');
}

export default function EntryList({ items, deleteAction, featuredAction }: Props) {
    const [toDelete, setToDelete] = useState<EntrySummary | null>(null);
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const t = useTranslations('Entries');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(item =>
            [displayTitle(item), item.tag, item.experienceName ?? '']
                .join(' ')
                .toLowerCase()
                .includes(q),
        );
    }, [items, query]);

    const confirmDelete = () => {
        if (!toDelete) return;
        const id = toDelete.id;
        startTransition(async () => {
            await deleteAction(id);
            setToDelete(null);
        });
    };

    const toggleFeatured = (item: EntrySummary) => {
        startTransition(async () => {
            await featuredAction(item.id, !item.featured);
        });
    };

    const featuredButton = (item: EntrySummary, sizeClass: string) => (
        <button
            type="button"
            onClick={() => toggleFeatured(item)}
            disabled={isPending}
            aria-pressed={item.featured}
            aria-label={item.featured ? tCommon('unmarkFeatured') : tCommon('markFeatured')}
            title={item.featured ? tCommon('unmarkFeatured') : tCommon('markFeatured')}
            className="p-1 rounded shrink-0 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed"
        >
            <Star
                className={`${sizeClass} transition-colors ${
                    item.featured
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-text-faint hover:text-amber-400'
                }`}
            />
        </button>
    );

    if (items.length === 0) {
        return (
            <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center text-text-muted">
                {t('empty')}
            </div>
        );
    }

    return (
        <>
            <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint pointer-events-none" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('listSearchPlaceholder')}
                    aria-label={t('listSearchPlaceholder')}
                    className={`${inputClassCompact} pl-10`}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center text-text-muted">
                    {t('listSearchEmpty', { query })}
                </div>
            ) : (
                <>
                    {/* Desktop: table */}
                    <div className="hidden md:block bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-elevated border-b border-border-light">
                                    <th className="p-4 font-semibold text-text-muted w-10" aria-label={tCommon('featuredAriaLabel')}>
                                        <Star className="w-4 h-4" aria-hidden="true" />
                                    </th>
                                    <th className="p-4 font-semibold text-text-muted">{t('colDate')}</th>
                                    <th className="p-4 font-semibold text-text-muted">{t('colTitle')}</th>
                                    <th className="p-4 font-semibold text-text-muted">{t('colExperience')}</th>
                                    <th className="p-4 font-semibold text-text-muted">{t('colTag')}</th>
                                    <th className="p-4 font-semibold text-text-muted text-right">{tCommon('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item.id} className="border-b border-border-light hover:bg-surface-elevated/50">
                                        <td className="p-4">{featuredButton(item, 'w-4 h-4')}</td>
                                        <td className="p-4 font-medium text-text-primary whitespace-nowrap">{formatDate(item.date, locale)}</td>
                                        <td className="p-4 text-text-secondary">{displayTitle(item)}</td>
                                        <td className="p-4 text-text-muted text-sm">{item.experienceName || '—'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(item.color)}`}>
                                                {item.tag}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <Link
                                                href={`/dashboard/entries/${item.id}`}
                                                className="inline-block px-3 py-2 rounded-lg text-blue-600 hover:bg-surface-elevated font-medium transition-colors"
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
                        {filtered.map((item) => (
                            <div key={item.id} className="bg-surface rounded-xl shadow-sm border border-border p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0">
                                        <div className="text-xs text-text-muted mb-0.5">{formatDate(item.date, locale)}</div>
                                        <div className="font-semibold text-text-primary inline-flex items-center gap-1.5">
                                            {featuredButton(item, 'w-3.5 h-3.5')}
                                            {displayTitle(item)}
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
                                        className="flex-1 text-center px-4 py-2 rounded-lg text-blue-600 hover:bg-surface-elevated font-medium transition-colors"
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
                </>
            )}

            <ConfirmDialog
                open={!!toDelete}
                title={t('deleteTitle')}
                description={
                    toDelete
                        ? t.rich('deleteDescription', {
                              title: displayTitle(toDelete),
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
