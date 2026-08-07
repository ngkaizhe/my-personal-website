import { prisma } from '@/lib/prisma';
import { aggregateSkills, type AggregatedSkill } from '@/lib/skills';

// Server-only counterpart to lib/skills.ts: the pure aggregation stays there
// (client components import it), the Prisma query lives here so pg never
// reaches a browser bundle.

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
