// Pure string helpers for the custom-domain feature. Imported by middleware,
// so this file must stay free of Prisma / Node-only dependencies.

// RFC-1123-ish hostname with at least one dot and an alphabetic TLD.
const HOSTNAME_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

function bareHost(host: string): string {
    // Tolerates values like "https://example.com/" so a scheme-prefixed
    // NEXT_PUBLIC_APP_HOST doesn't silently break host comparisons.
    return host.trim().toLowerCase()
        .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
        .split('/')[0]
        .split(':')[0];
}

function appHost(): string | null {
    const raw = process.env.NEXT_PUBLIC_APP_HOST;
    return raw ? bareHost(raw) : null;
}

/** The main app host as a bare hostname, regardless of how the env was typed. */
export function mainAppHost(): string | null {
    return appHost();
}

/**
 * Normalize user input ("HTTPS://Foo.com/bar") to a bare hostname ("foo.com").
 * Returns null when the input is not a bindable domain: malformed, an IP,
 * a *.vercel.app host, or the main app host itself.
 */
export function normalizeDomain(input: string): string | null {
    let s = input.trim().toLowerCase();
    if (!s) return null;
    s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
    s = s.split('/')[0].split('?')[0].split('#')[0]; // path / query / fragment
    s = s.split(':')[0]; // port
    s = s.replace(/\.$/, ''); // trailing dot
    if (!HOSTNAME_RE.test(s)) return null;
    if (IP_RE.test(s)) return null;
    if (s.endsWith('.vercel.app')) return null;
    if (s === appHost()) return null;
    return s;
}

/**
 * Is this request Host one of the main app's hosts (as opposed to a bound
 * custom domain)? Fail-open: anything unrecognizable counts as main so the
 * app never redirect-loops on misconfiguration.
 */
export function isMainHost(host: string): boolean {
    const bare = bareHost(host);
    if (!bare) return true;
    if (bare === 'localhost' || IP_RE.test(bare)) return true;
    if (bare.endsWith('.vercel.app')) return true;
    if (bare === appHost()) return true;
    // Only hosts that could actually be bound count as custom domains.
    return !HOSTNAME_RE.test(bare);
}
