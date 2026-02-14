'use client';

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

export interface TimelineItem {
    year: string;
    title: string;
    tag: string;
    tagColorClass: string; // Full Tailwind color class for tag background/text
    titleColorClass: string; // Full Tailwind color class for title
    numberColorClass: string; // Full Tailwind color class for number (or icon color)
    description: string;
    icon?: ReactNode;
    tags?: string[];
    link?: {
        url: string;
        text: string;
    };
}

const TimelineCard = ({ item, index, isRight }: { item: TimelineItem; index: number; isRight: boolean }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`mb-8 flex justify-between items-center w-full ${isRight ? 'flex-row-reverse' : ''}`}
        >
            <div className="order-1 w-5/12"></div>

            <div className={`z-20 flex items-center order-1 bg-white shadow-xl w-12 h-12 rounded-full border-4 border-white justify-center`}>
                {item.icon ? (
                    <div className={`${item.numberColorClass} w-6 h-6`}>
                        {item.icon}
                    </div>
                ) : (
                    <h1 className={`mx-auto font-semibold text-lg ${item.numberColorClass}`}>{index + 1}</h1>
                )}
            </div>

            <div className={`order-1 w-5/12 px-6 py-4 bg-white rounded-lg shadow-xl ${isRight ? 'text-right' : 'text-left'}`}>
                <div className={`mb-3 ${isRight ? 'flex justify-end' : 'flex justify-start'}`}>
                    <span className={`${item.tagColorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                        {item.tag}
                    </span>
                </div>
                <h3 className={`mb-1 font-bold ${item.titleColorClass} text-xl`}>{item.year}</h3>
                <p className="text-gray-400 text-sm mb-2">{item.title}</p>
                <p className="text-sm leading-snug tracking-wide text-gray-900 text-opacity-100 mb-4">
                    {item.description}
                </p>

                {item.tags && item.tags.length > 0 && (
                    <div className={`flex flex-wrap gap-2 mb-4 ${isRight ? 'justify-end' : 'justify-start'}`}>
                        {item.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {item.link && (
                    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                        <Link
                            href={item.link.url}
                            target="_blank"
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 transition-colors`}
                        >
                            {item.link.text}
                        </Link>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

interface TimelineProps {
    items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-4xl font-bold text-center mb-12 uppercase tracking-wider">My Journey</h2>

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
