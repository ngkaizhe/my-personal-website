import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, clearRateLimitState, rateLimitKey } from './rateLimit';

describe('rateLimitKey', () => {
    it('composes prefix with identifier', () => {
        expect(rateLimitKey('foo', 'user-1')).toBe('foo:user-1');
    });

    it('defaults missing identifier to "anon"', () => {
        expect(rateLimitKey('foo', null)).toBe('foo:anon');
        expect(rateLimitKey('foo', undefined)).toBe('foo:anon');
        expect(rateLimitKey('foo', '')).toBe('foo:anon');
    });
});

describe('checkRateLimit', () => {
    beforeEach(() => {
        clearRateLimitState();
        vi.useFakeTimers();
    });

    it('allows requests under the cap', () => {
        const r1 = checkRateLimit('k', { max: 3, windowSec: 60 });
        expect(r1.ok).toBe(true);
        expect(r1.remaining).toBe(2);

        const r2 = checkRateLimit('k', { max: 3, windowSec: 60 });
        expect(r2.ok).toBe(true);
        expect(r2.remaining).toBe(1);
    });

    it('rejects requests over the cap with retryAfter', () => {
        for (let i = 0; i < 3; i++) checkRateLimit('k', { max: 3, windowSec: 60 });
        const blocked = checkRateLimit('k', { max: 3, windowSec: 60 });
        expect(blocked.ok).toBe(false);
        expect(blocked.remaining).toBe(0);
        expect(blocked.retryAfter).toBeGreaterThan(0);
        expect(blocked.retryAfter).toBeLessThanOrEqual(60);
    });

    it('resets after the window expires', () => {
        for (let i = 0; i < 3; i++) checkRateLimit('k', { max: 3, windowSec: 60 });
        expect(checkRateLimit('k', { max: 3, windowSec: 60 }).ok).toBe(false);

        // Advance past the window
        vi.advanceTimersByTime(61_000);
        const fresh = checkRateLimit('k', { max: 3, windowSec: 60 });
        expect(fresh.ok).toBe(true);
        expect(fresh.remaining).toBe(2);
    });

    it('uses independent buckets per key', () => {
        for (let i = 0; i < 3; i++) checkRateLimit('a', { max: 3, windowSec: 60 });
        expect(checkRateLimit('a', { max: 3, windowSec: 60 }).ok).toBe(false);
        expect(checkRateLimit('b', { max: 3, windowSec: 60 }).ok).toBe(true);
    });
});
