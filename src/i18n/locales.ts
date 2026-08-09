// Single source of truth for the app's locales. Pure module — safe to import
// from client components, server code, and middleware alike (request.ts pulls
// in next/headers and must stay server-only, so the constants live here).

export const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'zh-TW';

export function isLocale(value: string | undefined | null): value is Locale {
    return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
