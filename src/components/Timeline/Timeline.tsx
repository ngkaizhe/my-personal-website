'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TimelineItem } from '@/lib/types';
import { TimelineRow } from './TimelineRow';
import { TimelineModal } from './TimelineModal';

interface TimelineProps {
    items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const t = useTranslations('Timeline');

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <div className="text-center mb-16 pt-8">
                <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-wider text-text-primary mb-4">
                    {t('heading')}
                </h1>
                <div className="w-16 h-1 bg-text-primary mx-auto mb-4 rounded-full opacity-60"></div>
                <p className="text-text-muted text-lg font-normal max-w-md mx-auto">
                    {t('subtitle')}
                </p>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20">
                    <MapPin className="w-12 h-12 text-text-faint mx-auto mb-4" />
                    <p className="text-text-muted text-lg mb-2">{t('emptyTitle')}</p>
                    <p className="text-text-faint text-sm">{t('emptyHint')}</p>
                </div>
            ) : (
                <>
                    <div className="relative wrap overflow-hidden px-4 py-10 md:p-10 h-full">
                        <div className="absolute h-full border-l-2 border-border-timeline opacity-40 left-5 md:left-1/2 md:-translate-x-1/2"></div>

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
