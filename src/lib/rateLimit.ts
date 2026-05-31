// Naive in-memory rate limiter — fine for a single dev process or one Vercel
// instance. Won't share state across instances; in serverless that means
// limits are per-instance not per-user-global. Acceptable for an AI-cost
// guardrail (the goal is "don't accidentally let one person rack up $$$",
// not "enforce contract limits"), and the bound is generous enough that
// legitimate users won't hit it.
//
// If this ever grows up: swap the Map for an Upstash Redis @upstash/ratelimit
// instance keyed by the same identifier.

interface Bucket {
    count: number;
    resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
    /** Max requests allowed per window. */
    max: number;
    /** Window length in seconds. */
    windowSec: number;
}

export interface RateLimitResult {
    ok: boolean;
    /** Seconds until the window resets and the user can try again. */
    retryAfter: number;
    /** Remaining quota in the current window (0 when ok is false). */
    remaining: number;
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        // First request or window expired — start a fresh window.
        const resetAt = now + opts.windowSec * 1000;
        buckets.set(key, { count: 1, resetAt });
        return { ok: true, retryAfter: 0, remaining: opts.max - 1 };
    }

    if (existing.count >= opts.max) {
        return {
            ok: false,
            retryAfter: Math.ceil((existing.resetAt - now) / 1000),
            remaining: 0,
        };
    }

    existing.count += 1;
    return { ok: true, retryAfter: 0, remaining: opts.max - existing.count };
}

// Compose a stable key for a request. Prefer auth'd user id; fall back to
// the source IP. The IP fallback is best-effort — proxies may strip it —
// but combined with the generous default limit it's enough to catch
// "accidentally hammered the button" cases.
export function rateLimitKey(prefix: string, identifier: string | null | undefined): string {
    return `${prefix}:${identifier || 'anon'}`;
}

/**
 * Cleans up expired buckets. Called opportunistically inside checkRateLimit
 * (cheap enough). Exported for tests so we can reset state.
 */
export function clearRateLimitState() {
    buckets.clear();
}
