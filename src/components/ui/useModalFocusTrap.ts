'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal a11y behavior (used by ConfirmDialog, TimelineModal and
 * NewExperienceModal so fixes land everywhere at once):
 * - remembers the trigger element and restores focus to it on close,
 * - moves initial focus to `initialFocusRef` (or the first focusable child),
 * - Escape closes,
 * - Tab / Shift+Tab cycle within the dialog.
 */
export function useModalFocusTrap({
    open,
    onClose,
    dialogRef,
    initialFocusRef,
}: {
    open: boolean;
    onClose: () => void;
    dialogRef: RefObject<HTMLElement | null>;
    initialFocusRef?: RefObject<HTMLElement | null>;
}) {
    useEffect(() => {
        if (!open) return;

        const trigger = document.activeElement as HTMLElement | null;
        const initial = initialFocusRef?.current
            ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
            ?? null;
        initial?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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
            trigger?.focus?.();
        };
    }, [open, onClose, dialogRef, initialFocusRef]);
}
