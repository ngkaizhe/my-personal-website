'use client';

import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TimelineItem } from '@/lib/types'

interface TimelineCardProps {
    item: TimelineItem;
    index: number;
    isRight: boolean;
    onClick: () => void;
}

function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export const TimelineCard = ({
    item,
    index,
    isRight,
    onClick
}: TimelineCardProps) => {
    const desktopAlign = isRight ? 'md:text-right' : 'md:text-left';
    const desktopJustify = isRight ? 'md:justify-end' : 'md:justify-start';
    return (
        <motion.div
            layoutId={`card-${index}`}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${item.title.content}`}
            className={`px-6 py-4 bg-surface rounded-lg shadow-xl
                text-left ${desktopAlign}
                cursor-pointer group hover:shadow-2xl transition-shadow
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
        >
            <div className={`mb-2 flex flex-wrap items-center gap-2 justify-start ${desktopJustify}`}>
                <span data-palette-accent className={`${item.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                    {item.category.text}
                </span>
                <span className="text-xs text-text-muted">{formatShortDate(item.date)}</span>
            </div>
            <h3 className="mb-1 font-bold text-text-primary text-lg md:text-xl">
                {item.actionVerb && (
                    <span data-palette-accent className={`${item.title.colorClass} mr-1`}>{item.actionVerb}</span>
                )}
                {item.title.content}
            </h3>
            {item.employer && (
                <p className="text-text-muted text-xs mb-2">
                    {item.employer.role} · {item.employer.name}
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
                <span>View details</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </motion.div>
    );
};
