'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { TimelineItem } from './TimelineItem';
import JourneyCard from '@/components/JourneyCard';

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

                        <JourneyCard
                            year={selectedItem.year.content}
                            title={selectedItem.title.content}
                            tag={selectedItem.category.text}
                            textColorClass={selectedItem.year.colorClass}
                            badgeColorClass={selectedItem.category.colorClass}
                            iconName={selectedItem.iconName}
                            description={selectedItem.description}
                            details={selectedItem.details}
                            techStack={selectedItem.techStack}
                            link={selectedItem.link}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
