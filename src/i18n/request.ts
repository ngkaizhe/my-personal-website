import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | undefined | null): value is Locale {
    return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// next-intl reads this on every server render. Cookie is the source of truth;
// no URL-prefix routing because the toggle is just a UI control like ThemeToggle.
export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('locale')?.value;
    const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return { locale, messages };
});
