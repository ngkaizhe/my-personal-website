'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { TimelineItem } from './TimelineItem';
import { TimelineIcon } from './TimelineIcon';

interface TimelineModalProps {
    selectedId: string | null;
    items: TimelineItem[];
    onClose: () => void;
}

export const TimelineModal = ({ selectedId, items, onClose }: TimelineModalProps) => {
    const selectedItem = items.find((_, index) => `card-${index}` === selectedId);

    return (
        <AnimatePresence>
            {selectedId && selectedItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        layoutId={selectedId}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-20"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>

                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border-4 border-white shadow-lg`}>
                                    <TimelineIcon iconName={selectedItem.iconName} className={`w-8 h-8 ${selectedItem.year.colorClass}`} />
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
    );
};
