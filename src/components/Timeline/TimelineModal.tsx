'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { TimelineItem } from '@/lib/types';
import EntryCard from '@/components/Entry/EntryCard';

interface TimelineModalProps {
    selectedId: string | null;
    items: TimelineItem[];
    onClose: () => void;
}

export const TimelineModal = ({ selectedId, items, onClose }: TimelineModalProps) => {
    const selectedItem = items.find((_, index) => `card-${index}` === selectedId);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const titleId = selectedId ? `modal-title-${selectedId}` : undefined;

    useEffect(() => {
        if (!selectedId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !modalRef.current) return;
            const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        closeButtonRef.current?.focus();
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, onClose]);

    if (!selectedId || !selectedItem) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div
                onClick={onClose}
                className="absolute inset-0 bg-overlay backdrop-blur-sm"
                aria-hidden="true"
            />

            <div
                ref={modalRef}
                className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 modal-pop-in"
            >
                <button
                    ref={closeButtonRef}
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-4 right-4 p-2 bg-btn-secondary-bg rounded-full hover:bg-btn-secondary-bg-hover transition-colors z-20
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Close details dialog"
                >
                    <X size={20} className="text-text-muted" />
                </button>

                <EntryCard
                    titleId={titleId}
                    date={new Date(selectedItem.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    title={selectedItem.title.content}
                    actionVerb={selectedItem.actionVerb}
                    tag={selectedItem.category.text}
                    textColorClass={selectedItem.year.colorClass}
                    badgeColorClass={selectedItem.category.colorClass}
                    iconName={selectedItem.iconName}
                    description={selectedItem.description}
                    impact={selectedItem.impact}
                    details={selectedItem.details}
                    techStack={selectedItem.techStack}
                    link={selectedItem.link}
                    employerName={selectedItem.employer?.name}
                    employerRole={selectedItem.employer?.role}
                />
            </div>
        </div>
    );
};
