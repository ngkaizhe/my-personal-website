import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { normalizeDomain, isMainHost, mainAppHost } from './customDomain';

describe('normalizeDomain', () => {
    it('lowercases and trims', () => {
        expect(normalizeDomain('  NgKaiZhe.Com ')).toBe('ngkaizhe.com');
    });
    it('strips scheme, path, query, port and trailing dot', () => {
        expect(normalizeDomain('https://ngkaizhe.com/resume?x=1')).toBe('ngkaizhe.com');
        expect(normalizeDomain('ngkaizhe.com:443')).toBe('ngkaizhe.com');
        expect(normalizeDomain('ngkaizhe.com.')).toBe('ngkaizhe.com');
    });
    it('accepts subdomains', () => {
        expect(normalizeDomain('me.example.co.uk')).toBe('me.example.co.uk');
    });
    it('rejects garbage, bare TLDs and IPs', () => {
        expect(normalizeDomain('')).toBeNull();
        expect(normalizeDomain('not a domain')).toBeNull();
        expect(normalizeDomain('localhost')).toBeNull();
        expect(normalizeDomain('192.168.1.1')).toBeNull();
    });
    it('rejects vercel.app and the main host', () => {
        expect(normalizeDomain('foo.vercel.app')).toBeNull();
        expect(normalizeDomain('my-personal-website.vercel.app')).toBeNull();
    });
});

describe('isMainHost', () => {
    const OLD = process.env.NEXT_PUBLIC_APP_HOST;
    beforeEach(() => { process.env.NEXT_PUBLIC_APP_HOST = 'my-personal-website.vercel.app'; });
    afterEach(() => { process.env.NEXT_PUBLIC_APP_HOST = OLD; });

    it('accepts the configured app host, vercel.app previews, localhost and IPs', () => {
        expect(isMainHost('my-personal-website.vercel.app')).toBe(true);
        expect(isMainHost('my-personal-website-git-x-user.vercel.app')).toBe(true);
        expect(isMainHost('localhost:3000')).toBe(true);
        expect(isMainHost('172.30.192.1:3000')).toBe(true);
        expect(isMainHost('')).toBe(true); // missing Host header: never treat as custom domain
    });
    it('rejects custom domains', () => {
        expect(isMainHost('ngkaizhe.com')).toBe(false);
        expect(isMainHost('www.ngkaizhe.com')).toBe(false);
    });
});

describe('mainAppHost', () => {
    const OLD = process.env.NEXT_PUBLIC_APP_HOST;
    afterEach(() => { process.env.NEXT_PUBLIC_APP_HOST = OLD; });

    it('tolerates a scheme-prefixed env value (real misconfiguration we hit)', () => {
        process.env.NEXT_PUBLIC_APP_HOST = 'https://my-app.vercel.app/';
        expect(mainAppHost()).toBe('my-app.vercel.app');
        // The custom-domain check must also still recognize it as main.
        expect(isMainHost('my-app.vercel.app')).toBe(true);
    });

    it('passes a bare host through unchanged', () => {
        process.env.NEXT_PUBLIC_APP_HOST = 'my-app.vercel.app';
        expect(mainAppHost()).toBe('my-app.vercel.app');
    });
});
