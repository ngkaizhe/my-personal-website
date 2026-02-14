'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TimelineItem } from './TimelineItem';
import { TimelineCard } from './TimelineCard';

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

            <div className={`z-20 flex items-center order-1 bg-white shadow-xl w-12 h-12 rounded-full border-4 border-white justify-center group-hover:scale-110 transition-transform`}>
                {item.icon ? (
                    <div className={`${item.year.colorClass} w-6 h-6`}>
                        {item.icon}
                    </div>
                ) : (
                    <h1 className={`mx-auto font-semibold text-lg ${item.year.colorClass}`}>{index + 1}</h1>
                )}
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
