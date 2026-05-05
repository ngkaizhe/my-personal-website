'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    pendingLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    pending?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    pendingLabel,
    cancelLabel = 'Cancel',
    danger = false,
    pending = false,
    onConfirm,
    onClose,
}: Props) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        // Remember the element that opened the dialog so focus can return there
        // when the dialog closes (keyboard / screen reader users).
        triggerRef.current = document.activeElement as HTMLElement | null;

        // Default focus on Cancel — for destructive flows this avoids an
        // accidental Enter committing the action.
        cancelRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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

        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            // Restore focus to the trigger element after close.
            triggerRef.current?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    const titleId = 'confirm-dialog-title';

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 modal-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div
                className="absolute inset-0 bg-overlay backdrop-blur-sm"
                onClick={() => !pending && onClose()}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                className="relative bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 z-10 modal-pop-in"
            >
                <button
                    type="button"
                    onClick={() => !pending && onClose()}
                    disabled={pending}
                    className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                <h2 id={titleId} className="text-xl font-bold text-text-primary mb-2">
                    {title}
                </h2>
                <div className="text-text-secondary mb-6">{description}</div>
                <div className="flex justify-end gap-3">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        disabled={pending}
                        className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-elevated font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={pending}
                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            danger
                                ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-400'
                                : 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400'
                        }`}
                    >
                        {pending ? pendingLabel ?? `${confirmLabel}…` : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
