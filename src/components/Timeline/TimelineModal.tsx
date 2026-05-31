'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Pencil } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { TimelineItem } from '@/lib/types';
import EntryCard from '@/components/Entry/EntryCard';

interface TimelineModalProps {
    selectedId: string | null;
    items: TimelineItem[];
    onClose: () => void;
    /** When true, an Edit button appears in the modal that links to
     *  /dashboard/entries/[id]. Pass true only when the viewer owns the
     *  timeline being displayed. */
    editable?: boolean;
}

export const TimelineModal = ({ selectedId, items, onClose, editable = false }: TimelineModalProps) => {
    const selectedItem = items.find((_, index) => `card-${index}` === selectedId);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const titleId = selectedId ? `modal-title-${selectedId}` : undefined;
    const t = useTranslations('Timeline');
    const locale = useLocale();

    useEffect(() => {
        if (!selectedId) return;

        // Remember the card that opened the modal so focus can return to it
        // when the modal closes — keyboard / SR users otherwise lose their
        // place in the timeline.
        triggerRef.current = document.activeElement as HTMLElement | null;

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
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            triggerRef.current?.focus?.();
        };
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
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    {editable && (
                        <Link
                            href={`/dashboard/entries/${selectedItem.id}`}
                            onClick={(e) => { e.stopPropagation(); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-btn-secondary-bg hover:bg-btn-secondary-bg-hover text-text-secondary hover:text-text-primary rounded-full transition-colors text-sm font-medium
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label={t('editEntry')}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            {t('edit')}
                        </Link>
                    )}
                    <button
                        ref={closeButtonRef}
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-2 bg-btn-secondary-bg rounded-full hover:bg-btn-secondary-bg-hover transition-colors
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={t('closeDialog')}
                    >
                        <X size={20} className="text-text-muted" />
                    </button>
                </div>

                <EntryCard
                    titleId={titleId}
                    date={new Date(selectedItem.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
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
                    experienceName={selectedItem.experience?.organization}
                    experienceRole={selectedItem.experience?.role ?? undefined}
                />
            </div>
        </div>
    );
};
