'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { TimelineItem } from '@/lib/types'

interface TimelineCardProps {
    item: TimelineItem;
    isRight: boolean;
    onClick: () => void;
}

function formatShortDate(iso: string, locale: string) {
    return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short' });
}

export const TimelineCard = ({
    item,
    isRight,
    onClick
}: TimelineCardProps) => {
    const desktopAlign = isRight ? 'md:text-right' : 'md:text-left';
    const desktopJustify = isRight ? 'md:justify-end' : 'md:justify-start';
    const t = useTranslations('Timeline');
    const locale = useLocale();
    return (
        <div
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={t('viewDetailsFor', { title: item.title.content })}
            className={`px-6 py-4 bg-surface rounded-lg shadow-xl
                text-left ${desktopAlign}
                cursor-pointer group hover:shadow-2xl transition-shadow
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
        >
            <div className={`mb-2 flex flex-wrap items-center gap-2 justify-start ${desktopJustify}`}>
                <span data-palette-accent className={`${item.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                    {item.category.text}
                </span>
                <span className="text-xs text-text-muted">{formatShortDate(item.date, locale)}</span>
            </div>
            <h3 className="mb-1 font-bold text-text-primary text-lg md:text-xl">
                {item.actionVerb && (
                    <>
                        <span data-palette-accent className={item.title.colorClass}>{item.actionVerb}</span>
                        {' '}
                    </>
                )}
                {item.title.content}
            </h3>
            {item.experience && (
                <p className="text-text-muted text-xs mb-2">
                    {item.experience.role
                        ? `${item.experience.role} · ${item.experience.organization}`
                        : item.experience.organization}
                </p>
            )}
            <p className="text-sm leading-snug tracking-wide text-text-secondary">
                {item.description}
            </p>
            {item.impact && (
                <div className={`mt-2 flex items-start gap-1.5 text-xs font-medium text-green-700 dark:text-green-400
                    justify-start ${desktopJustify}`}>
                    <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{item.impact}</span>
                </div>
            )}
            <div className={`mt-2 flex items-center gap-1 text-xs text-text-faint transition-opacity
                opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100
                justify-start ${desktopJustify}`}>
                <span>{t('viewDetails')}</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </div>
    );
};
