// Shared form control styling. Single source of truth so the six forms that
// used to declare their own copies can't drift apart (they already had:
// ResumeBuilder lost the hover border, DomainSettings inlined a variant).

export const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

/** Shorter variant for dense control rows (résumé filters). */
export const inputClassCompact = `
    w-full px-4 py-2.5 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

export const labelClass = 'block text-sm font-medium text-form-label mb-2';

// Display names for the locale tabs. Each locale is written in its own
// language, so these are deliberately NOT translated.
export const LOCALE_LABEL: Record<string, string> = {
    en: 'English',
    'zh-TW': '中文',
};
