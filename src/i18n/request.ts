import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';

// Re-export so existing imports keep working; the constants themselves live
// in the pure module @/i18n/locales (importable from client code).
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';

// next-intl reads this on every server render. Cookie is the source of truth;
// no URL-prefix routing because the toggle is just a UI control like ThemeToggle.
export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('locale')?.value;
    const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return { locale, messages };
});
