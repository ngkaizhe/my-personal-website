import { prisma } from '@/lib/prisma';
import { pickTranslation } from '@/lib/translations';
import { aggregateSkills, type AggregatedSkill } from '@/lib/skills';

export interface YearReviewHighlight {
    id: string;
    date: string;
    title: string;
    actionVerb: string | null;
    impact: string | null;
}

export interface YearReviewData {
    year: number;
    totalEntries: number;
    entriesWithImpact: number;
    featuredCount: number;
    topTags: Array<{ name: string; count: number }>;
    topSkills: AggregatedSkill[];
    highlights: YearReviewHighlight[];
    hasData: boolean;
}

// Aggregate everything a user did in a given calendar year. Used by both the
// owner's /dashboard/year/[year] view and the public /@user/year/[year] page.
// Calls into pickTranslation so the locale follows the request.
export async function fetchYearReview(userId: string, year: number, locale: string): Promise<YearReviewData> {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

    const entries = await prisma.entry.findMany({
        where: { userId, date: { gte: yearStart, lt: yearEnd } },
        select: {
            id: true,
            date: true,
            featured: true,
            primaryLocale: true,
            tagSlug: true,
            techStack: true,
            translations: { select: { locale: true, title: true, actionVerb: true, impact: true, tag: true } },
        },
        orderBy: { date: 'desc' },
    });

    const totalEntries = entries.length;

    // Featured = user explicitly marked résumé-worthy. Used to pick highlights.
    const featuredEntries = entries.filter(e => e.featured);
    const entriesWithImpact = entries.filter(e => {
        const tr = pickTranslation(e.translations, locale, e.primaryLocale);
        return !!(tr?.impact && tr.impact.trim());
    }).length;

    // Top tags: kebab slug groups identical tags across locales, but for the
    // *display* label we surface whichever locale matches the request.
    const tagCounts = new Map<string, { display: string; count: number }>();
    for (const e of entries) {
        const tr = pickTranslation(e.translations, locale, e.primaryLocale);
        if (!tr) continue;
        const slug = e.tagSlug || tr.tag.toLowerCase();
        const existing = tagCounts.get(slug);
        if (existing) existing.count++;
        else tagCounts.set(slug, { display: tr.tag, count: 1 });
    }
    const topTags = Array.from(tagCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(({ display, count }) => ({ name: display, count }));

    const topSkills = aggregateSkills(entries.map(e => e.techStack)).slice(0, 10);

    // Highlights = featured entries, then fall back to first 6 of any kind
    // when featured isn't enough. Sorted by date desc.
    const pickFrom = featuredEntries.length >= 3 ? featuredEntries : entries;
    const highlights: YearReviewHighlight[] = pickFrom.slice(0, 6).map(e => {
        const tr = pickTranslation(e.translations, locale, e.primaryLocale);
        return {
            id: e.id,
            date: e.date.toISOString(),
            title: tr?.title ?? '',
            actionVerb: tr?.actionVerb ?? null,
            impact: tr?.impact ?? null,
        };
    });

    return {
        year,
        totalEntries,
        entriesWithImpact,
        featuredCount: featuredEntries.length,
        topTags,
        topSkills,
        highlights,
        hasData: totalEntries > 0,
    };
}
