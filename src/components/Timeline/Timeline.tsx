'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { TimelineItem } from '@/lib/types';
import { TimelineRow } from './TimelineRow';
import { TimelineModal } from './TimelineModal';

interface TimelineProps {
    items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <div className="text-center mb-16 pt-8">
                <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-wider text-text-primary mb-4">
                    My Journey
                </h1>
                <div className="w-16 h-1 bg-blue-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-text-muted text-lg font-normal max-w-md mx-auto">
                    A timeline of milestones, growth, and the path that shaped who I am today.
                </p>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20">
                    <MapPin className="w-12 h-12 text-text-faint mx-auto mb-4" />
                    <p className="text-text-muted text-lg mb-2">No milestones yet</p>
                    <p className="text-text-faint text-sm">Start adding journey items to build your timeline.</p>
                </div>
            ) : (
                <>
                    <div className="relative wrap overflow-hidden px-4 py-10 md:p-10 h-full">
                        <div className="border-2-2 absolute border-opacity-20 border-border-timeline h-full border left-5 md:left-1/2"></div>

                        {items.map((item, index) => (
                            <TimelineRow key={index} item={item} index={index} isRight={index % 2 !== 0} setSelectedId={setSelectedId} />
                        ))}
                    </div>

                    <TimelineModal
                        selectedId={selectedId}
                        items={items}
                        onClose={() => setSelectedId(null)}
                    />
                </>
            )}
        </div>
    );
};

export default Timeline;
