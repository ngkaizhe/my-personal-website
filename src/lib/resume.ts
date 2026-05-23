import { prisma } from '@/lib/prisma';
import { pickTranslation } from '@/lib/translations';
import type { ExperienceType } from '@/lib/types';

export interface ResumeEntry {
    id: string;
    date: string;
    actionVerb: string | null;
    title: string;
    description: string;
    impact: string | null;
    techStack: string[];
}

export interface ResumeExperience {
    id: string;
    type: ExperienceType;
    organization: string;
    role: string | null;
    startDate: string;
    endDate: string | null;
    description: string | null;
    entries: ResumeEntry[];
}

export interface ResumeData {
    experiences: ResumeExperience[];
    unlinkedEntries: ResumeEntry[];
    skills: { name: string; count: number }[];
}

export async function fetchResumeByUserId(userId: string, locale: string): Promise<ResumeData> {
    const [experiences, unlinkedEntries] = await Promise.all([
        prisma.experience.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            include: {
                translations: true,
                entries: {
                    orderBy: { date: 'desc' },
                    include: { translations: true },
                },
            },
        }),
        prisma.entry.findMany({
            where: { userId, experienceId: null },
            orderBy: { date: 'desc' },
            include: { translations: true },
        }),
    ]);

    type EntryDbRow = (typeof unlinkedEntries)[number];

    const toResumeEntry = (e: EntryDbRow): ResumeEntry | null => {
        const tr = pickTranslation(e.translations, locale, e.primaryLocale);
        if (!tr) return null;
        return {
            id: e.id,
            date: e.date.toISOString(),
            actionVerb: tr.actionVerb,
            title: tr.title,
            description: tr.description,
            impact: tr.impact,
            techStack: e.techStack,
        };
    };

    const flattenedExperiences: ResumeExperience[] = experiences.flatMap(exp => {
        const expTr = pickTranslation(exp.translations, locale, exp.primaryLocale);
        if (!expTr) return [];
        const resumeEntries = exp.entries
            .map(toResumeEntry)
            .filter((e): e is ResumeEntry => e !== null);
        return [{
            id: exp.id,
            type: exp.type,
            organization: expTr.organization,
            role: expTr.role,
            startDate: exp.startDate.toISOString(),
            endDate: exp.endDate?.toISOString() ?? null,
            description: expTr.description,
            entries: resumeEntries,
        }];
    });

    const flattenedUnlinked: ResumeEntry[] = unlinkedEntries
        .map(toResumeEntry)
        .filter((e): e is ResumeEntry => e !== null);

    const allEntries = [...flattenedUnlinked, ...flattenedExperiences.flatMap(e => e.entries)];
    const skillCounts = new Map<string, number>();
    for (const entry of allEntries) {
        for (const skill of entry.techStack) {
            skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
        }
    }
    const skills = Array.from(skillCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
        experiences: flattenedExperiences,
        unlinkedEntries: flattenedUnlinked,
        skills,
    };
}
