'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TimelineItem } from '@/lib/types';
import { TimelineRow } from './TimelineRow';
import { TimelineModal } from './TimelineModal';

interface TimelineProps {
    items: TimelineItem[];
    /** Pass true when the signed-in user owns the timeline (i.e. dashboard
     *  view) so the modal can show an Edit button. */
    editable?: boolean;
}

const Timeline = ({ items, editable = false }: TimelineProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const t = useTranslations('Timeline');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const skillFilter = searchParams.get('skill');

    // Press `/` from anywhere on the page (when not typing into another field)
    // to focus the search box. Esc clears + blurs. Mirrors GitHub / Linear.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const inField = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            );
            if (e.key === '/' && !inField) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                setQuery('');
                searchInputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const filteredItems = useMemo(() => {
        let pool = items;
        if (skillFilter) {
            const skillLc = skillFilter.toLowerCase();
            pool = pool.filter(item => item.techStack.some(s => s.toLowerCase() === skillLc));
        }
        const q = query.trim().toLowerCase();
        if (!q) return pool;
        return pool.filter(item => {
            const haystack = [
                item.title.content,
                item.actionVerb ?? '',
                item.description,
                item.impact ?? '',
                item.details ?? '',
                item.category.text,
                item.experience?.organization ?? '',
                item.experience?.role ?? '',
                ...item.techStack,
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [items, query, skillFilter]);

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <div className="text-center mb-10 pt-8">
                <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-wider text-text-primary mb-4">
                    {t('heading')}
                </h1>
                <div className="w-16 h-1 bg-text-primary mx-auto mb-4 rounded-full opacity-60"></div>
                <p className="text-text-muted text-lg font-normal max-w-md mx-auto">
                    {t('subtitle')}
                </p>
            </div>

            {skillFilter && (
                <div className="max-w-xl mx-auto mb-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-sm text-text-secondary">
                        <span>{t('filteringBySkill', { skill: skillFilter })}</span>
                        <a
                            href={typeof window !== 'undefined' ? window.location.pathname : '/'}
                            className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                            {t('clearSkillFilter')}
                        </a>
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <div className="max-w-xl mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            aria-label={t('searchAriaLabel')}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all duration-200 hover:border-input-border-hover text-sm"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => { setQuery(''); searchInputRef.current?.focus(); }}
                                aria-label={t('clearSearch')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-faint hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {!query && (
                            <span
                                aria-hidden="true"
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs font-mono text-text-faint bg-surface-elevated border border-border-light rounded"
                            >
                                /
                            </span>
                        )}
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center py-20">
                    <MapPin className="w-12 h-12 text-text-faint mx-auto mb-4" />
                    <p className="text-text-muted text-lg mb-2">{t('emptyTitle')}</p>
                    <p className="text-text-faint text-sm">{t('emptyHint')}</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20">
                    <Search className="w-12 h-12 text-text-faint mx-auto mb-4" />
                    <p className="text-text-muted text-lg mb-2">{t('searchEmpty', { query })}</p>
                </div>
            ) : (
                <>
                    <div className="relative wrap overflow-hidden px-4 py-10 md:p-10 h-full">
                        <div className="absolute h-full border-l-2 border-border-timeline opacity-40 left-5 md:left-1/2 md:-translate-x-1/2"></div>

                        {filteredItems.map((item, index) => (
                            <TimelineRow key={item.id} item={item} index={index} isRight={index % 2 !== 0} setSelectedId={setSelectedId} />
                        ))}
                    </div>

                    <TimelineModal
                        selectedId={selectedId}
                        items={filteredItems}
                        onClose={() => setSelectedId(null)}
                        editable={editable}
                    />
                </>
            )}
        </div>
    );
};

export default Timeline;
