'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';

// Two-language toggle. Persists locale to a cookie like ThemeToggle and refreshes
// the route so server components re-render with the new messages.
const NEXT_LOCALE: Record<string, 'en' | 'zh-TW'> = {
    en: 'zh-TW',
    'zh-TW': 'en',
};

export const LocaleToggle = () => {
    const locale = useLocale();
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const t = useTranslations('Locale');

    const next = NEXT_LOCALE[locale] ?? 'en';
    const currentLabel = t(locale as 'en' | 'zh-TW');
    const nextLabel = t(next);

    const handleClick = () => {
        document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            aria-label={t('label', { current: currentLabel })}
            title={nextLabel}
            className="inline-flex items-center gap-1.5 h-11 px-3 text-sm text-header-text hover:text-header-text-hover hover:bg-nav-hover rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
            <Languages className="w-4 h-4" />
            <span className="font-medium">{nextLabel}</span>
        </button>
    );
};
