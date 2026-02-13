'use client';

import React from 'react';

export interface TimelineItem {
    year: string;
    title: string;
    tag: string;
    tagColorClass: string; // Full Tailwind color class for tag background/text
    titleColorClass: string; // Full Tailwind color class for title
    numberColorClass: string; // Full Tailwind color class for number
    description: string;
}

const TimelineCard = ({ item, index, isRight }: { item: TimelineItem; index: number; isRight: boolean }) => {
    return (
        <div className={`mb-8 flex justify-between items-center w-full ${isRight ? 'flex-row-reverse' : ''}`}>
            <div className="order-1 w-5/12"></div>

            <div className={`z-20 flex items-center order-1 bg-white shadow-xl w-12 h-12 rounded-full border-4 border-white justify-center`}>
                <h1 className={`mx-auto font-semibold text-lg ${item.numberColorClass}`}>{index + 1}</h1>
            </div>

            <div className={`order-1 w-5/12 px-6 py-4 bg-white rounded-lg shadow-xl ${isRight ? 'text-right' : 'text-left'}`}>
                <div className={`mb-3 ${isRight ? 'flex justify-end' : 'flex justify-start'}`}>
                    <span className={`${item.tagColorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                        {item.tag}
                    </span>
                </div>
                <h3 className={`mb-1 font-bold ${item.titleColorClass} text-xl`}>{item.year}</h3>
                <p className="text-gray-400 text-sm mb-2">{item.title}</p>
                <p className="text-sm leading-snug tracking-wide text-gray-900 text-opacity-100">
                    {item.description}
                </p>
            </div>
        </div>
    );
};

interface TimelineProps {
    items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-4xl font-bold text-center mb-12 uppercase tracking-wider">Timeline</h2>
            <h3 className="text-xl font-semibold text-center mb-12 uppercase tracking-wide">History of Borcelle</h3>

            <div className="relative wrap overflow-hidden p-10 h-full">
                <div className="border-2-2 absolute border-opacity-20 border-gray-700 h-full border left-1/2"></div>

                {items.map((item, index) => (
                    <TimelineCard key={index} item={item} index={index} isRight={index % 2 !== 0} />
                ))}
            </div>
        </div>
    );
};

export default Timeline;
