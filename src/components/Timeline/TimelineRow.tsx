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
            className="mb-8 relative flex items-center w-full"
        >
            {/* Desktop: icon centered on timeline */}
            <div className="hidden md:flex z-20 absolute left-1/2 -translate-x-1/2 items-center bg-surface shadow-xl w-12 h-12 rounded-full border-4 border-surface justify-center">
                <LucideIcon iconName={item.iconName} className={`w-6 h-6 ${item.year.colorClass}`} />
            </div>

            {/* Desktop: card on left or right */}
            <div className={`hidden md:flex w-full ${isRight ? 'justify-end' : 'justify-start'}`}>
                <div className="w-5/12">
                    <TimelineCard
                        item={item}
                        index={index}
                        isRight={isRight}
                        onClick={() => setSelectedId(`card-${index}`)}
                    />
                </div>
            </div>

            {/* Mobile: icon left, card right */}
            <div className="flex md:hidden items-center w-full">
                <div className="z-20 shrink-0 flex items-center bg-surface shadow-xl w-10 h-10 rounded-full border-4 border-surface justify-center">
                    <LucideIcon iconName={item.iconName} className={`w-5 h-5 ${item.year.colorClass}`} />
                </div>
                <div className="flex-1 ml-4">
                    <TimelineCard
                        item={item}
                        index={index}
                        isRight={false}
                        onClick={() => setSelectedId(`card-${index}`)}
                    />
                </div>
            </div>
        </motion.div>
    );
};
