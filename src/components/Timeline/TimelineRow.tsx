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
            className={`mb-8 flex justify-between items-center w-full
                flex-row md:${isRight ? 'flex-row-reverse' : 'flex-row'}`}
        >
            <div className="order-1 w-5/12 hidden md:block"></div>

            <div className="z-20 flex items-center shrink-0 bg-surface shadow-xl w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-surface justify-center transition-transform">
                <LucideIcon iconName={item.iconName} className={`w-5 h-5 md:w-6 md:h-6 ${item.year.colorClass}`} />
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
