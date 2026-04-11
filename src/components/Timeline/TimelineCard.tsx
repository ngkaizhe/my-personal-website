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
            className={`flex-1 ml-4 md:ml-0 md:order-1 md:w-5/12 md:flex-none px-6 py-4 bg-surface rounded-lg shadow-xl
                text-left ${isRight ? 'md:text-right' : 'md:text-left'}
                cursor-pointer group hover:shadow-2xl transition-shadow relative`}
        >
            <div className={`mb-3 flex justify-start ${isRight ? 'md:justify-end' : 'md:justify-start'}`}>
                <span className={`${item.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                    {item.category.text}
                </span>
            </div>
            <h3 className={`mb-1 font-bold ${item.title.colorClass} text-xl`}>{item.year.content}</h3>
            <p className="text-text-faint text-sm mb-2">{item.title.content}</p>
            <p className="text-sm leading-snug tracking-wide text-text-primary">
                {item.description}
            </p>
            <div className={`mt-2 flex items-center gap-1 text-xs text-text-faint opacity-0 group-hover:opacity-100 transition-opacity
                justify-start ${isRight ? 'md:justify-end' : 'md:justify-start'}`}>
                <span>View details</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </motion.div>
    );
};
