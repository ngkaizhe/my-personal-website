'use client';

import { motion } from 'motion/react';
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
            className={`order-1 w-5/12 px-6 py-4 bg-white dark:bg-zinc-900 rounded-lg shadow-xl ${isRight ? 'text-right' : 'text-left'} cursor-pointer group hover:shadow-2xl transition-shadow`}
        >
            <div className={`mb-3 ${isRight ? 'flex justify-end' : 'flex justify-start'}`}>
                <span className={`${item.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                    {item.category.text}
                </span>
            </div>
            <h3 className={`mb-1 font-bold ${item.title.colorClass} text-xl`}>{item.year.content}</h3>
            <p className="text-gray-400 text-sm mb-2">{item.title.content}</p>
            <p className="text-sm leading-snug tracking-wide text-gray-900 dark:text-gray-100 text-opacity-100">
                {item.description}
            </p>
            <div className={`mt-2 text-xs text-gray-400 dark:text-gray-500 ${isRight ? 'text-right' : 'text-left'}`}>
                Click to view details...
            </div>
        </motion.div>
    );
};
