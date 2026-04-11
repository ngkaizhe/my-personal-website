'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TimelineItem } from '@/lib/types';
import { TimelineCard } from './TimelineCard';
import { LucideIcon } from '@/components/ui/LucideIcon';

interface TimelineRowProps {
    item: TimelineItem;
    index: number;
    isRight: boolean;
    setSelectedId: (id: string) => void;
}

export const TimelineRow = ({
    item,
    index,
    isRight,
    setSelectedId
}: TimelineRowProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`mb-8 flex justify-between items-center w-full ${isRight ? 'flex-row-reverse' : ''}`}
        >
            <div className="order-1 w-5/12"></div>

            <div className={`z-20 flex items-center order-1 bg-white dark:bg-zinc-900 shadow-xl w-12 h-12 rounded-full border-4 border-white dark:border-zinc-900 justify-center group-hover:scale-110 transition-transform`}>
                <LucideIcon iconName={item.iconName} className={`w-6 h-6 ${item.year.colorClass}`} />
            </div>

            <TimelineCard
                item={item}
                index={index}
                isRight={isRight}
                onClick={() => setSelectedId(`card-${index}`)}
            />
        </motion.div>
    );
};
