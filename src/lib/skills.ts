import { prisma } from '@/lib/prisma';

// Skill aggregation with case-insensitive de-duplication. Without this,
// "Node", "node", and "Node.js" would each count as separate skills on the
// résumé. We bucket by trim+lowercase and keep the first-seen display label
// so the user's own capitalisation wins (e.g. "TypeScript" beats "typescript"
// if it was typed that way first).

export interface AggregatedSkill {
    name: string;
    count: number;
}

export function aggregateSkills(perEntryStacks: string[][]): AggregatedSkill[] {
    const counts = new Map<string, number>();
    const displayFor = new Map<string, string>();
    for (const stack of perEntryStacks) {
        for (const raw of stack) {
            const display = raw.trim();
            if (!display) continue;
            const key = display.toLowerCase();
            counts.set(key, (counts.get(key) ?? 0) + 1);
            if (!displayFor.has(key)) {
                displayFor.set(key, display);
            }
        }
    }
    return Array.from(counts.entries())
        .map(([key, count]) => ({ name: displayFor.get(key)!, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Query helper: aggregated skills for one user. Single source of truth for
 * both the dashboard page and the public /@username/skills page (matching
 * the lib/timeline.ts + lib/resume.ts convention).
 */
export async function fetchSkillsByUserId(userId: string): Promise<AggregatedSkill[]> {
    const entries = await prisma.entry.findMany({
        where: { userId },
        select: { techStack: true },
    });
    return aggregateSkills(entries.map(e => e.techStack));
}
