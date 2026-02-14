'use client';

import React, { useState } from 'react';
import { TimelineItem } from './TimelineItem';
import { TimelineRow } from './TimelineRow';
import { TimelineModal } from './TimelineModal';

interface TimelineProps {
    items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <h2 className="text-4xl font-bold text-center mb-12 uppercase tracking-wider">My Journey</h2>

            <div className="relative wrap overflow-hidden p-10 h-full">
                <div className="border-2-2 absolute border-opacity-20 border-gray-700 h-full border left-1/2"></div>

                {items.map((item, index) => (
                    <TimelineRow key={index} item={item} index={index} isRight={index % 2 !== 0} setSelectedId={setSelectedId} />
                ))}
            </div>

            <TimelineModal
                selectedId={selectedId}
                items={items}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
};

export default Timeline;
