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

export interface ResumeExperience {
    id: string;
    name: string;
    role: string;
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

export async function fetchResumeByUserId(userId: string): Promise<ResumeData> {
    const [experiences, entries] = await Promise.all([
        prisma.experience.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                },
            },
        }),
        prisma.entry.findMany({
            where: { userId, experienceId: null },
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

    const allEntries = [...entries, ...experiences.flatMap(e => e.entries)];
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
        experiences: experiences.map(exp => ({
            id: exp.id,
            name: exp.name,
            role: exp.role,
            startDate: exp.startDate.toISOString(),
            endDate: exp.endDate?.toISOString() ?? null,
            description: exp.description,
            entries: exp.entries.map(toResumeEntry),
        })),
        unlinkedEntries: entries.map(toResumeEntry),
        skills,
    };
}
