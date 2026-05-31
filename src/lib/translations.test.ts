import { describe, it, expect } from 'vitest';
import { pickTranslation, hasTranslation, tagToSlug, hashSource, isBlankEntryTranslation, isBlankExperienceTranslation } from './translations';

describe('pickTranslation', () => {
    const en = { locale: 'en', text: 'hello' };
    const zh = { locale: 'zh-TW', text: '你好' };

    it('returns exact locale match when present', () => {
        const result = pickTranslation([en, zh], 'zh-TW', 'en');
        expect(result?.text).toBe('你好');
    });

    it('falls back to primaryLocale when requested locale is missing', () => {
        const result = pickTranslation([en], 'zh-TW', 'en');
        expect(result?.text).toBe('hello');
    });

    it('falls back to first available when neither requested nor primary present', () => {
        const fr = { locale: 'fr', text: 'salut' };
        const result = pickTranslation([fr], 'zh-TW', 'en');
        expect(result?.text).toBe('salut');
    });

    it('returns null when the array is empty', () => {
        expect(pickTranslation([], 'en', 'en')).toBeNull();
    });
});

describe('hasTranslation', () => {
    it('detects exact locale presence', () => {
        expect(hasTranslation([{ locale: 'en' }], 'en')).toBe(true);
        expect(hasTranslation([{ locale: 'en' }], 'zh-TW')).toBe(false);
        expect(hasTranslation([], 'en')).toBe(false);
    });
});

describe('tagToSlug', () => {
    it('lowercases + kebab-cases', () => {
        expect(tagToSlug('Engineering')).toBe('engineering');
        expect(tagToSlug('Career Growth')).toBe('career-growth');
    });

    it('strips leading/trailing dashes and collapses runs', () => {
        expect(tagToSlug('  Hello, World!  ')).toBe('hello-world');
        expect(tagToSlug('---R&D Notes---')).toBe('r-d-notes');
    });

    it('returns empty string for all-symbol input', () => {
        expect(tagToSlug('!!!')).toBe('');
    });
});

describe('hashSource', () => {
    it('returns a 16-char hex string', () => {
        const hash = hashSource({ a: 'one', b: 'two' });
        expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('is stable across key order', () => {
        const h1 = hashSource({ a: 'x', b: 'y' });
        const h2 = hashSource({ b: 'y', a: 'x' });
        expect(h1).toBe(h2);
    });

    it('differs when values change', () => {
        const h1 = hashSource({ a: 'x' });
        const h2 = hashSource({ a: 'y' });
        expect(h1).not.toBe(h2);
    });
});

describe('isBlankEntryTranslation', () => {
    it('treats whitespace-only fields as blank', () => {
        expect(isBlankEntryTranslation({ title: '   ', description: '\n\t' })).toBe(true);
    });

    it('returns false if any field has content', () => {
        expect(isBlankEntryTranslation({ title: 'X', description: '' })).toBe(false);
    });
});

describe('isBlankExperienceTranslation', () => {
    it('returns true when organization is empty', () => {
        expect(isBlankExperienceTranslation({ organization: '' })).toBe(true);
    });

    it('returns false when organization has content', () => {
        expect(isBlankExperienceTranslation({ organization: 'Co.' })).toBe(false);
    });
});
