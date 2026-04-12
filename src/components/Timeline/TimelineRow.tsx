'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
    const reduceMotion = useReducedMotion();
    const delay = reduceMotion ? 0 : Math.min(index * 0.1, 0.8);
    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 50 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.3, delay }}
            className="mb-8 flex items-center w-full relative"
        >
            {/* Icon: mobile = inline left; desktop = absolute centered on timeline */}
            <div className="shrink-0 z-20 flex items-center justify-center bg-surface shadow-xl rounded-full border-4 border-surface
                w-10 h-10 md:w-12 md:h-12
                md:absolute md:left-1/2 md:-translate-x-1/2">
                <LucideIcon data-palette-accent iconName={item.iconName} className={`w-5 h-5 md:w-6 md:h-6 ${item.year.colorClass}`} />
            </div>

            {/* Card: mobile = flex-1 right of icon; desktop = 5/12 width, positioned via ml-auto for right cards */}
            <div className={`flex-1 ml-4 md:flex-none md:w-5/12 md:ml-0 ${isRight ? 'md:ml-auto' : ''}`}>
                <TimelineCard
                    item={item}
                    index={index}
                    isRight={isRight}
                    onClick={() => setSelectedId(`card-${index}`)}
                />
            </div>
        </motion.div>
    );
};
