'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { TimelineItem } from '@/lib/types'

interface TimelineCardProps {
    item: TimelineItem;
    index: number;
    isRight: boolean;
    onClick: () => void;
}

export const TimelineCard = ({
    item,
    index,
    isRight,
    onClick
}: TimelineCardProps) => {
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
            aria-label={`View details for ${item.year.content} — ${item.title.content}`}
            className={`px-6 py-4 bg-surface rounded-lg shadow-xl
                ${isRight ? 'text-right' : 'text-left'}
                cursor-pointer group hover:shadow-2xl transition-shadow
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
        >
            <div className={`mb-3 ${isRight ? 'flex justify-end' : 'flex justify-start'}`}>
                <span data-palette-accent className={`${item.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                    {item.category.text}
                </span>
            </div>
            <h3 data-palette-accent className={`mb-1 font-bold ${item.title.colorClass} text-xl`}>{item.year.content}</h3>
            <p className="text-text-faint text-sm mb-2">{item.title.content}</p>
            <p className="text-sm leading-snug tracking-wide text-text-primary">
                {item.description}
            </p>
            <div className={`mt-2 flex items-center gap-1 text-xs text-text-faint opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity
                ${isRight ? 'justify-end' : 'justify-start'}`}>
                <span>View details</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </motion.div>
    );
};
