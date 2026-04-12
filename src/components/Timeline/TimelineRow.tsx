'use client';

import React from 'react';
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
    const delay = Math.min(index * 0.08, 0.6);
    return (
        <div
            className="timeline-row-reveal mb-8 flex items-center w-full relative"
            style={{ animationDelay: `${delay}s` }}
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
        </div>
    );
};
