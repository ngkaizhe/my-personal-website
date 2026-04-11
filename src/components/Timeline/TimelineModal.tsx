'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { TimelineItem } from '@/lib/types';
import JourneyCard from '@/components/Journey/JourneyCard';

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
                        className="absolute inset-0 bg-overlay backdrop-blur-sm"
                    />

                    <motion.div
                        layoutId={selectedId}
                        className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="absolute top-4 right-4 p-2 bg-btn-secondary-bg rounded-full hover:bg-btn-secondary-bg-hover transition-colors z-20"
                        >
                            <X size={20} className="text-text-muted" />
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
