import { describe, it, expect } from 'vitest';
import { summariseYear, type YearReviewEntryInput } from './yearReview';

function entry(over: Partial<YearReviewEntryInput> = {}): YearReviewEntryInput {
    return {
        id: over.id ?? 'e1',
        date: over.date ?? new Date('2025-03-01T00:00:00Z'),
        featured: over.featured ?? false,
        primaryLocale: over.primaryLocale ?? 'en',
        tagSlug: over.tagSlug ?? 'engineering',
        techStack: over.techStack ?? [],
        translations: over.translations ?? [
            { locale: 'en', title: 'Title', actionVerb: 'Shipped', impact: null, tag: 'Engineering' },
        ],
    };
}

describe('summariseYear', () => {
    it('reports empty state with no entries', () => {
        const r = summariseYear([], 2025, 'en');
        expect(r).toMatchObject({ year: 2025, totalEntries: 0, hasData: false, featuredCount: 0 });
        expect(r.topTags).toEqual([]);
        expect(r.highlights).toEqual([]);
    });

    it('counts entries, featured, and entries carrying an impact', () => {
        const r = summariseYear([
            entry({ id: 'a', featured: true, translations: [{ locale: 'en', title: 'A', actionVerb: null, impact: 'Cut latency 20%', tag: 'Eng' }] }),
            entry({ id: 'b', translations: [{ locale: 'en', title: 'B', actionVerb: null, impact: '   ', tag: 'Eng' }] }),
            entry({ id: 'c' }),
        ], 2025, 'en');
        expect(r.totalEntries).toBe(3);
        expect(r.featuredCount).toBe(1);
        // whitespace-only impact does not count
        expect(r.entriesWithImpact).toBe(1);
        expect(r.hasData).toBe(true);
    });

    it('groups tags by slug across locales but displays the requested locale label', () => {
        const bilingual = (id: string) => entry({
            id,
            tagSlug: 'engineering',
            translations: [
                { locale: 'en', title: id, actionVerb: null, impact: null, tag: 'Engineering' },
                { locale: 'zh-TW', title: id, actionVerb: null, impact: null, tag: '工程' },
            ],
        });
        const zh = summariseYear([bilingual('a'), bilingual('b')], 2025, 'zh-TW');
        expect(zh.topTags).toEqual([{ name: '工程', count: 2 }]);
        const en = summariseYear([bilingual('a'), bilingual('b')], 2025, 'en');
        expect(en.topTags).toEqual([{ name: 'Engineering', count: 2 }]);
    });

    it('caps top tags at 5, sorted by count', () => {
        const entries = ['a', 'b', 'c', 'd', 'e', 'f'].flatMap((slug, i) =>
            Array.from({ length: i + 1 }, (_, n) => entry({
                id: `${slug}${n}`,
                tagSlug: slug,
                translations: [{ locale: 'en', title: 't', actionVerb: null, impact: null, tag: slug }],
            })),
        );
        const r = summariseYear(entries, 2025, 'en');
        expect(r.topTags).toHaveLength(5);
        expect(r.topTags[0]).toEqual({ name: 'f', count: 6 });
    });

    it('uses featured entries as highlights once there are at least three', () => {
        const entries = [
            entry({ id: 'f1', featured: true }),
            entry({ id: 'f2', featured: true }),
            entry({ id: 'f3', featured: true }),
            entry({ id: 'plain' }),
        ];
        const r = summariseYear(entries, 2025, 'en');
        expect(r.highlights.map(h => h.id)).toEqual(['f1', 'f2', 'f3']);
    });

    it('falls back to all entries when fewer than three are featured', () => {
        const entries = [entry({ id: 'f1', featured: true }), entry({ id: 'p1' }), entry({ id: 'p2' })];
        const r = summariseYear(entries, 2025, 'en');
        expect(r.highlights.map(h => h.id)).toEqual(['f1', 'p1', 'p2']);
    });

    it('caps highlights at six', () => {
        const entries = Array.from({ length: 9 }, (_, i) => entry({ id: `e${i}` }));
        expect(summariseYear(entries, 2025, 'en').highlights).toHaveLength(6);
    });

    it('aggregates top skills case-insensitively', () => {
        const r = summariseYear([
            entry({ id: 'a', techStack: ['TypeScript', 'React'] }),
            entry({ id: 'b', techStack: ['typescript'] }),
        ], 2025, 'en');
        expect(r.topSkills[0]).toEqual({ name: 'TypeScript', count: 2 });
    });

    it('falls back to the primary locale when the requested locale is missing', () => {
        const r = summariseYear([entry({
            id: 'a',
            primaryLocale: 'zh-TW',
            translations: [{ locale: 'zh-TW', title: '中文標題', actionVerb: null, impact: null, tag: '工程' }],
        })], 2025, 'en');
        expect(r.highlights[0].title).toBe('中文標題');
    });
});
