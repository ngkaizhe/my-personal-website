'use server';

import { prisma } from '@/lib/prisma';

export interface ResumeEntry {
    id: string;
    date: string;
    actionVerb: string | null;
    title: string;
    description: string;
    impact: string | null;
    techStack: string[];
}

export interface ResumeEmployer {
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
    entries: ResumeEntry[];
}

export interface ResumeData {
    employers: ResumeEmployer[];
    unlinkedEntries: ResumeEntry[];
    skills: { name: string; count: number }[];
}

export async function getResumeData(): Promise<ResumeData> {
    const [employers, entries] = await Promise.all([
        prisma.employer.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                },
            },
        }),
        prisma.entry.findMany({
            where: { employerId: null },
            orderBy: { date: 'desc' },
        }),
    ]);

    const toResumeEntry = (e: typeof entries[number]): ResumeEntry => ({
        id: e.id,
        date: e.date.toISOString(),
        actionVerb: e.actionVerb,
        title: e.title,
        description: e.description,
        impact: e.impact,
        techStack: e.techStack,
    });

    // Aggregate skills from ALL entries
    const allEntries = [...entries, ...employers.flatMap(e => e.entries)];
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
        employers: employers.map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            startDate: emp.startDate.toISOString(),
            endDate: emp.endDate?.toISOString() ?? null,
            description: emp.description,
            entries: emp.entries.map(toResumeEntry),
        })),
        unlinkedEntries: entries.map(toResumeEntry),
        skills,
    };
}
