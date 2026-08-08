import { describe, it, expect } from 'vitest';
import { buildPersonJsonLd, jsonLdString } from './personJsonLd';

describe('buildPersonJsonLd', () => {
    it('builds a ProfilePage wrapping a Person with skills and employer', () => {
        const out = buildPersonJsonLd({
            displayName: '黃開哲',
            username: 'ngkaizhe',
            bio: 'Backend engineer.',
            image: 'https://example.com/a.png',
            profileUrl: 'https://ngkaizhe.com',
            sameAs: ['https://github.com/x'],
            knowsAbout: ['C#', 'Spark'],
            worksFor: 'Bridgewell',
        });
        expect(out['@type']).toBe('ProfilePage');
        expect(out.mainEntity).toMatchObject({
            '@type': 'Person',
            name: '黃開哲',
            alternateName: '@ngkaizhe',
            knowsAbout: ['C#', 'Spark'],
            worksFor: { '@type': 'Organization', name: 'Bridgewell' },
        });
    });

    it('omits empty optional fields', () => {
        const out = buildPersonJsonLd({
            displayName: 'X', username: 'x', bio: null, image: null,
            profileUrl: 'https://x.com', sameAs: [], knowsAbout: [], worksFor: null,
        });
        expect(out.mainEntity).not.toHaveProperty('description');
        expect(out.mainEntity).not.toHaveProperty('sameAs');
        expect(out.mainEntity).not.toHaveProperty('worksFor');
    });
});

describe('jsonLdString', () => {
    it('escapes < so </script> cannot break out of the inline tag', () => {
        expect(jsonLdString({ a: '</script><script>alert(1)</script>' })).not.toContain('</script>');
    });
});
