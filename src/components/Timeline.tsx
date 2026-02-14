'use client';

import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { X } from 'lucide-react';

export class TimelineItem {
    year: {
        content: string;
        colorClass: string;
    };
    title: {
        content: string;
        colorClass: string;
    };
    category: {
        text: string;
        colorClass: string;
    };
    techStack: string[];
    description: string;
    details?: string;
    icon?: ReactNode;
    link?: {
        url: string;
        text: string;
    };

    constructor(data: {
        year: { content: string; colorClass: string };
        title: { content: string; colorClass: string };
        category: { text: string; colorClass: string };
        description: string;
        techStack?: string[];
        details?: string;
        icon?: ReactNode;
        link?: { url: string; text: string };
    }) {
        this.year = data.year;
        this.title = data.title;
        this.category = data.category;
        this.description = data.description;
        this.techStack = data.techStack || [];
        this.details = data.details;
        this.icon = data.icon;
        this.link = data.link;
    }
}

const TimelineCard = ({
    item,
    index,
    isRight,
    onClick
}: {
    item: TimelineItem;
    index: number;
    isRight: boolean;
    onClick: () => void;
}) => {
    return (
        <motion.div
            layoutId={`card-${index}`}
            onClick={onClick}
            className={`order-1 w-5/12 px-6 py-4 bg-white rounded-lg shadow-xl ${isRight ? 'text-right' : 'text-left'} cursor-pointer group hover:shadow-2xl transition-shadow`}
        >
            <div className={`mb-3 ${isRight ? 'flex justify-end' : 'flex justify-start'}`}>
                <span className={`${item.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                    {item.category.text}
                </span>
            </div>
            <h3 className={`mb-1 font-bold ${item.title.colorClass} text-xl`}>{item.year.content}</h3>
            <p className="text-gray-400 text-sm mb-2">{item.title.content}</p>
            <p className="text-sm leading-snug tracking-wide text-gray-900 text-opacity-100">
                {item.description}
            </p>
            <div className={`mt-2 text-xs text-gray-400 ${isRight ? 'text-right' : 'text-left'}`}>
                Click to view details...
            </div>
        </motion.div>
    );
};

const TimelineRow = ({
    item,
    index,
    isRight,
    setSelectedId
}: {
    item: TimelineItem;
    index: number;
    isRight: boolean;
    setSelectedId: (id: string) => void;
}) => {
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

interface TimelineProps {
    items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedItem = items.find((_, index) => `card-${index}` === selectedId);

    return (
        <div className="container mx-auto px-4 py-8 relative">
            <h2 className="text-4xl font-bold text-center mb-12 uppercase tracking-wider">My Journey</h2>

            <div className="relative wrap overflow-hidden p-10 h-full">
                <div className="border-2-2 absolute border-opacity-20 border-gray-700 h-full border left-1/2"></div>

                {items.map((item, index) => (
                    <TimelineRow key={index} item={item} index={index} isRight={index % 2 !== 0} setSelectedId={setSelectedId} />
                ))}
            </div>

            <AnimatePresence>
                {selectedId && selectedItem && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            layoutId={selectedId}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-20"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>

                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border-4 border-white shadow-lg`}>
                                        {selectedItem.icon ? (
                                            <div className={`${selectedItem.year.colorClass} w-8 h-8`}>
                                                {selectedItem.icon}
                                            </div>
                                        ) : (
                                            <h1 className={`font-semibold text-2xl ${selectedItem.year.colorClass}`}>#</h1>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`${selectedItem.category.colorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                            {selectedItem.category.text}
                                        </span>
                                        <h3 className={`mt-1 font-bold ${selectedItem.title.colorClass} text-3xl`}>{selectedItem.year.content}</h3>
                                        <p className="text-gray-500">{selectedItem.title.content}</p>
                                    </div>
                                </div>

                                <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                                    <p className="text-lg leading-relaxed mb-4">{selectedItem.description}</p>
                                    {selectedItem.details && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm leading-relaxed">
                                            {selectedItem.details}
                                        </div>
                                    )}
                                </div>

                                {/* Tech Stack */}
                                {selectedItem.techStack.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Tech Stack</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.techStack.map((tag, i) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Links */}
                                {selectedItem.link && (
                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Link
                                            href={selectedItem.link.url}
                                            target="_blank"
                                            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-gray-200"
                                        >
                                            {selectedItem.link.text}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Timeline;
