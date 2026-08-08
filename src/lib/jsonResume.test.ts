import { describe, it, expect } from 'vitest';
import { mapToJsonResume, type JsonResumeUser } from './jsonResume';
import type { ResumeData } from './resume';

const user: JsonResumeUser = {
    username: 'kaizhe',
    displayName: '黃開哲',
    name: 'Kaizhe',
    bio: 'Backend engineer.',
    image: 'https://example.com/a.png',
    contactEmail: 'k@example.com',
    linkedin: 'https://linkedin.com/in/kaizhe',
    github: 'https://github.com/kaizhe',
    website: null,
};

const resume: ResumeData = {
    experiences: [
        {
            id: 'e1',
            type: 'JOB',
            organization: 'Bridgewell',
            role: 'Research Developer',
            startDate: '2023-12-01T00:00:00.000Z',
            endDate: null,
            description: 'Bidder team.',
            entries: [
                {
                    id: 'n1',
                    date: '2025-05-01T00:00:00.000Z',
                    actionVerb: 'Built',
                    title: 'Pacing 2.0',
                    description: 'PID-based pacing',
                    impact: 'smoother spend',
                    techStack: ['C#', 'Python'],
                    featured: true,
                },
            ],
        },
        {
            id: 'e2',
            type: 'EDUCATION',
            organization: 'NTUST',
            role: 'BSc CS',
            startDate: '2017-06-01T00:00:00.000Z',
            endDate: '2021-01-01T00:00:00.000Z',
            description: null,
            entries: [],
        },
    ],
    unlinkedEntries: [],
    skills: [{ name: 'C#', count: 12 }, { name: 'Python', count: 4 }],
};

describe('mapToJsonResume', () => {
    const out = mapToJsonResume(user, resume, { profileUrl: 'https://ngkaizhe.com', locale: 'en' });

    it('maps basics with label from the latest job and social profiles', () => {
        expect(out.basics.name).toBe('黃開哲');
        expect(out.basics.label).toBe('Research Developer');
        expect(out.basics.url).toBe('https://ngkaizhe.com');
        expect(out.basics.profiles).toEqual([
            { network: 'GitHub', url: 'https://github.com/kaizhe' },
            { network: 'LinkedIn', url: 'https://linkedin.com/in/kaizhe' },
        ]);
    });

    it('maps JOB to work with verb+title—impact (stack) highlights and day-precision dates', () => {
        expect(out.work).toHaveLength(1);
        expect(out.work[0]).toMatchObject({ name: 'Bridgewell', position: 'Research Developer', startDate: '2023-12-01' });
        expect(out.work[0]).not.toHaveProperty('endDate');
        expect(out.work[0].highlights).toEqual(['Built Pacing 2.0 — smoother spend (C#, Python)']);
    });

    it('maps EDUCATION to education and skills to name-only items', () => {
        expect(out.education).toEqual([
            { institution: 'NTUST', studyType: 'BSc CS', startDate: '2017-06-01', endDate: '2021-01-01' },
        ]);
        expect(out.skills).toEqual([{ name: 'C#' }, { name: 'Python' }]);
    });

    it('advertises the canonical json url in meta', () => {
        expect(out.meta.canonical).toBe('https://ngkaizhe.com/resume.json');
    });
});
