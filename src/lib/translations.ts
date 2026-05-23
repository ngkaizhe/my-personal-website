import { createHash } from 'node:crypto';

// Helpers for the bilingual content model. Each Entry / Experience has a
// translations[] array, one row per locale. The display path collapses that
// array down to a single locale's view with a deterministic fallback policy:
//
//   1. Exact locale hit.
//   2. The entity's primaryLocale (set when the user first created it).
//   3. Whatever's left.
//
// Why the fallback: a user might write a new entry in 中文 first and only fill
// the EN translation later. Public profile viewed in EN shouldn't render an
// empty card — it should show the 中文 source, and the UI can hint that no
// English version exists yet.

export type Locale = 'en' | 'zh-TW';

interface Translatable<T> {
    locale: string;
}

export function pickTranslation<T extends { locale: string }>(
    translations: T[],
    locale: string,
    primaryLocale: string,
): T | null {
    if (translations.length === 0) return null;
    const exact = translations.find(t => t.locale === locale);
    if (exact) return exact;
    const primary = translations.find(t => t.locale === primaryLocale);
    if (primary) return primary;
    return translations[0] ?? null;
}

// Returns true if a translation exists for the exact locale (no fallback).
// Used to render "missing translation" badges on the form's locale tabs.
export function hasTranslation(translations: { locale: string }[], locale: string): boolean {
    return translations.some(t => t.locale === locale);
}

// Cross-locale stable key for a tag. The display label can be "Engineering"
// in en and "工程" in zh-TW, but resume sectioning + badge colour + filtering
// all key off this slug. Stored on Entry.tagSlug; regenerated from the
// primary-locale tag whenever the entry is written.
export function tagToSlug(tag: string): string {
    return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Sentinel value used by EntryForm / ExperienceForm to detect "user has
// authored content for this locale". Empty title/organization counts as not
// authored even if a translation row technically exists (e.g. blank draft).
export function isBlankEntryTranslation(t: { title: string; description: string }): boolean {
    return !t.title.trim() && !t.description.trim();
}

export function isBlankExperienceTranslation(t: { organization: string }): boolean {
    return !t.organization.trim();
}

// Suppress unused-export warnings for the Translatable<T> placeholder above;
// kept for type docs.
export type { Translatable };

// Stable hash of a source-locale translation's fields. Used both by the
// translate API (when AI translates X → Y, we record what X looked like at
// that moment) and by the read path (when X has been edited since, the
// recorded hash no longer matches and Y is flagged stale).
export function hashSource(source: Record<string, string>): string {
    const sortedKeys = Object.keys(source).sort();
    const stable = JSON.stringify(source, sortedKeys);
    return createHash('sha256').update(stable).digest('hex').substring(0, 16);
}

