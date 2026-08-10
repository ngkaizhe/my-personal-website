import { describe, it, expect } from 'vitest';
import { buildUserLlmsTxt, buildSiteLlmsTxt } from './llmsTxt';

describe('buildUserLlmsTxt', () => {
    const txt = buildUserLlmsTxt({
        displayName: '黃開哲',
        username: 'ngkaizhe',
        bio: 'Backend engineer.',
        domain: 'ngkaizhe.com',
        timelinePath: '/',
        resumePath: '/resume',
        mainHost: 'main.example.com',
    });

    it('starts with an H1 naming the user and quotes the bio', () => {
        expect(txt.startsWith('# 黃開哲 (@ngkaizhe)\n')).toBe(true);
        expect(txt).toContain('> Backend engineer.');
    });

    it('links timeline, résumé, resume.json on the domain and skills on the main host', () => {
        expect(txt).toContain('https://ngkaizhe.com/');
        expect(txt).toContain('https://ngkaizhe.com/resume');
        expect(txt).toContain('https://ngkaizhe.com/resume.json');
        expect(txt).toContain('https://main.example.com/u/ngkaizhe/skills');
    });

    it('omits the skills line without a main host and the quote without a bio', () => {
        const bare = buildUserLlmsTxt({
            displayName: 'X', username: 'x', bio: null,
            domain: 'x.com', timelinePath: '/journey', resumePath: '/',
            mainHost: null,
        });
        expect(bare).not.toContain('skills');
        expect(bare).not.toContain('>');
        expect(bare).toContain('https://x.com/journey');
    });
});

describe('buildSiteLlmsTxt', () => {
    it('describes the product and points at the demo profile', () => {
        const txt = buildSiteLlmsTxt('main.example.com');
        expect(txt.startsWith('# My Journey\n')).toBe(true);
        expect(txt).toContain('https://main.example.com/u/demo');
        expect(txt).toContain('https://main.example.com/u/demo/resume.json');
    });
});
