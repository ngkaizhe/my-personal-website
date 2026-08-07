// Shared URL sanitation for user-supplied links that end up rendered as
// <a href> on public pages. Anything that isn't plain http(s) — javascript:,
// data:, vbscript:, protocol-relative — is rejected outright.

const HTTP_URL_RE = /^https?:\/\/\S+$/i;

/** Returns the trimmed URL when it is a plain http(s) URL, otherwise null. */
export function sanitizeHttpUrl(input: string | null | undefined): string | null {
    const s = (input ?? '').trim();
    if (!s) return null;
    return HTTP_URL_RE.test(s) ? s : null;
}

/** Like sanitizeHttpUrl but https-only (e.g. avatar images). */
export function sanitizeHttpsUrl(input: string | null | undefined): string | null {
    const s = sanitizeHttpUrl(input);
    return s && s.toLowerCase().startsWith('https://') ? s : null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a YYYY-MM-DD form value into a Date, or null when missing/garbled.
 * Guards server actions against `new Date(undefined)` → Invalid Date → opaque
 * Prisma 500s.
 */
export function parseFormDate(input: string | null | undefined): Date | null {
    const s = (input ?? '').trim();
    if (!DATE_RE.test(s)) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}
