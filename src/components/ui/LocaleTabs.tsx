'use client';

import { useRef } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n/locales';
import { LOCALE_LABEL } from '@/lib/formStyles';

export interface LocaleTabState {
    /** No content authored for this locale yet. */
    blank: boolean;
    /** Translated earlier but the source has changed since. */
    stale: boolean;
}

interface Props {
    activeLocale: Locale;
    onSelect: (locale: Locale) => void;
    /** Per-locale badge state, keyed by locale. */
    states: Record<string, LocaleTabState>;
    labels: {
        tablist: string;
        missing: string;
        stale: string;
    };
    /** Distinguishes tab/panel ids when two tab sets share a page. */
    idPrefix?: string;
}

/**
 * The bilingual form's locale switcher. Implements the full ARIA tabs pattern
 * (roving tabindex + arrow/Home/End keys) that EntryForm and ExperienceForm
 * were each missing when they hand-rolled this markup.
 */
export function LocaleTabs({ activeLocale, onSelect, states, labels, idPrefix = '' }: Props) {
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        const idx = SUPPORTED_LOCALES.indexOf(activeLocale);
        let next: number | null = null;
        if (e.key === 'ArrowRight') next = (idx + 1) % SUPPORTED_LOCALES.length;
        else if (e.key === 'ArrowLeft') next = (idx - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = SUPPORTED_LOCALES.length - 1;
        if (next === null) return;
        e.preventDefault();
        const target = SUPPORTED_LOCALES[next];
        onSelect(target);
        tabRefs.current[target]?.focus();
    };

    return (
        <div role="tablist" aria-label={labels.tablist} className="flex gap-1 border-b border-form-section-border">
            {SUPPORTED_LOCALES.map(loc => {
                const { blank, stale } = states[loc] ?? { blank: true, stale: false };
                const isActive = activeLocale === loc;
                return (
                    <button
                        key={loc}
                        ref={el => { tabRefs.current[loc] = el; }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`${idPrefix}tabpanel-${loc}`}
                        id={`${idPrefix}tab-${loc}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onSelect(loc)}
                        onKeyDown={onKeyDown}
                        className={`px-4 py-2.5 text-sm font-medium rounded-t-lg cursor-pointer transition-colors
                            flex items-center gap-2
                            ${isActive
                                ? 'bg-surface-elevated text-text-primary border border-form-section-border border-b-transparent -mb-px'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/50'
                            }
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                    >
                        {LOCALE_LABEL[loc] ?? loc}
                        {blank && <AlertCircle className="w-4 h-4 text-amber-500" aria-label={labels.missing} />}
                        {stale && !blank && <RefreshCw className="w-3.5 h-3.5 text-amber-500" aria-label={labels.stale} />}
                        {!blank && !stale && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />}
                    </button>
                );
            })}
        </div>
    );
}
