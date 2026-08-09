import { describe, it, expect } from 'vitest';
import { resolveDomainPaths, normalizeAltPath, normalizeViewPaths } from './domainPaths';

describe('resolveDomainPaths', () => {
    it('root=TIMELINE puts timeline at / and resume at altPath', () => {
        expect(resolveDomainPaths({ domainRootView: 'TIMELINE', domainAltPath: '/resume' }))
            .toEqual({ timelinePath: '/', resumePath: '/resume' });
    });
    it('root=RESUME swaps them', () => {
        expect(resolveDomainPaths({ domainRootView: 'RESUME', domainAltPath: '/journey' }))
            .toEqual({ timelinePath: '/journey', resumePath: '/' });
    });
});

describe('normalizeAltPath', () => {
    it('normalizes casing, whitespace, and a missing leading slash', () => {
        expect(normalizeAltPath('  Resume ')).toEqual({ ok: true, path: '/resume' });
        expect(normalizeAltPath('/cv')).toEqual({ ok: true, path: '/cv' });
        expect(normalizeAltPath('my-journey')).toEqual({ ok: true, path: '/my-journey' });
    });
    it('rejects /, empty, multi-segment, and bad characters', () => {
        // /_next fails the format check before the reserved check can fire —
        // the leading underscore is not a legal path character here.
        for (const bad of ['/', '', '/a/b', '/with space', '/中文', '/-leading-dash', '/_next']) {
            expect(normalizeAltPath(bad)).toEqual({ ok: false, error: 'invalid_path' });
        }
    });
    it('rejects reserved segments but allows resume', () => {
        for (const r of ['/u', '/d', '/api', '/dashboard', '/setup', '/signin', '/signup']) {
            expect(normalizeAltPath(r)).toEqual({ ok: false, error: 'reserved_path' });
        }
        expect(normalizeAltPath('/resume')).toEqual({ ok: true, path: '/resume' });
    });
});

describe('RESERVED_PATH_SEGMENTS', () => {
    it('rejects the public sub-page namespaces as alt paths', () => {
        for (const seg of ['skills', 'year', 'entry']) {
            expect(normalizeAltPath(`/${seg}`)).toEqual({ ok: false, error: 'reserved_path' });
        }
    });
});

describe('normalizeViewPaths', () => {
    it('timeline at / stores TIMELINE root + resume alt', () => {
        expect(normalizeViewPaths('/', '/resume'))
            .toEqual({ ok: true, rootView: 'TIMELINE', altPath: '/resume' });
    });
    it('resume at / stores RESUME root + timeline alt (normalized)', () => {
        expect(normalizeViewPaths(' Journey ', '/'))
            .toEqual({ ok: true, rootView: 'RESUME', altPath: '/journey' });
    });
    it('rejects when neither or both paths are /', () => {
        expect(normalizeViewPaths('/a', '/b')).toEqual({ ok: false, error: 'need_root' });
        expect(normalizeViewPaths('/', '/')).toEqual({ ok: false, error: 'need_root' });
    });
    it('propagates alt-path validation errors', () => {
        expect(normalizeViewPaths('/', '/a/b')).toEqual({ ok: false, error: 'invalid_path' });
        expect(normalizeViewPaths('/dashboard', '/')).toEqual({ ok: false, error: 'reserved_path' });
    });
});
