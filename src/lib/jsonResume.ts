// JSON Resume (https://jsonresume.org/schema) output — the machine-readable
// résumé served at /@username/resume.json (and /resume.json on a bound custom
// domain) so ATS tooling and AI agents can consume the résumé without parsing
// HTML. The mapper is pure so it can be unit-tested with fixtures.

import type { ResumeData, ResumeEntry, ResumeExperience } from '@/lib/resume';

export interface JsonResumeUser {
    username: string;
    displayName: string | null;
    name: string | null;
    bio: string | null;
    resumeSummaryEn?: string | null;
    resumeSummaryZh?: string | null;
    image: string | null;
    contactEmail: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
}

const SCHEMA_URL = 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json';

function isoDay(iso: string): string {
    return iso.slice(0, 10);
}

function bullet(entry: ResumeEntry): string {
    const parts: string[] = [];
    const verb = entry.actionVerb?.trim();
    if (verb) parts.push(verb);
    parts.push(entry.title);
    let line = parts.join(' ');
    if (entry.impact) line += ` — ${entry.impact}`;
    if (entry.techStack.length > 0) line += ` (${entry.techStack.join(', ')})`;
    return line;
}

function workLike(exp: ResumeExperience) {
    return {
        startDate: isoDay(exp.startDate),
        ...(exp.endDate ? { endDate: isoDay(exp.endDate) } : {}),
        ...(exp.description ? { summary: exp.description } : {}),
        ...(exp.entries.length > 0 ? { highlights: exp.entries.map(bullet) } : {}),
    };
}

export function mapToJsonResume(
    user: JsonResumeUser,
    resume: ResumeData,
    opts: { profileUrl: string; locale: string },
) {
    const displayName = user.displayName || user.name || `@${user.username}`;
    const jobs = resume.experiences.filter(e => e.type === 'JOB');
    const latestJob = jobs[0];
    // Dedicated résumé summary wins over the (more casual) timeline bio.
    const summary = (opts.locale === 'zh-TW'
        ? user.resumeSummaryZh ?? user.resumeSummaryEn
        : user.resumeSummaryEn ?? user.resumeSummaryZh) ?? user.bio;

    const profiles = [
        user.github ? { network: 'GitHub', url: user.github } : null,
        user.linkedin ? { network: 'LinkedIn', url: user.linkedin } : null,
        user.website ? { network: 'Website', url: user.website } : null,
    ].filter((p): p is { network: string; url: string } => p !== null);

    return {
        $schema: SCHEMA_URL,
        basics: {
            name: displayName,
            ...(latestJob?.role ? { label: latestJob.role } : {}),
            ...(user.image ? { image: user.image } : {}),
            ...(user.contactEmail ? { email: user.contactEmail } : {}),
            url: opts.profileUrl,
            ...(summary ? { summary } : {}),
            ...(profiles.length > 0 ? { profiles } : {}),
        },
        work: jobs.map(exp => ({
            name: exp.organization,
            ...(exp.role ? { position: exp.role } : {}),
            ...workLike(exp),
        })),
        volunteer: resume.experiences
            .filter(e => e.type === 'VOLUNTEER')
            .map(exp => ({
                organization: exp.organization,
                ...(exp.role ? { position: exp.role } : {}),
                ...workLike(exp),
            })),
        education: resume.experiences
            .filter(e => e.type === 'EDUCATION')
            .map(exp => ({
                institution: exp.organization,
                ...(exp.role ? { studyType: exp.role } : {}),
                startDate: isoDay(exp.startDate),
                ...(exp.endDate ? { endDate: isoDay(exp.endDate) } : {}),
            })),
        projects: resume.experiences
            .filter(e => e.type === 'PROJECT')
            .map(exp => ({
                name: exp.organization,
                ...(exp.description ? { description: exp.description } : {}),
                startDate: isoDay(exp.startDate),
                ...(exp.endDate ? { endDate: isoDay(exp.endDate) } : {}),
                ...(exp.entries.length > 0 ? { highlights: exp.entries.map(bullet) } : {}),
            })),
        skills: resume.skills.map(s => ({ name: s.name })),
        meta: {
            canonical: `${opts.profileUrl}/resume.json`,
            locale: opts.locale,
            generator: 'my-journey',
        },
    };
}
