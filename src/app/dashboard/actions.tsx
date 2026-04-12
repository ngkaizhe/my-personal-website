'use server';

import { prisma } from '@/lib/prisma';
import { getTextClass, getBadgeClass } from '@/lib/colors';
import type { TimelineItem } from '@/lib/types';

export async function getTimelineItems(): Promise<TimelineItem[]> {
    try {
        const items = await prisma.entry.findMany({
            include: {
                icon: true,
                employer: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return items.map((dbItem): TimelineItem => {
            const color = dbItem.color;
            const year = dbItem.date.getFullYear().toString();
            return {
                id: dbItem.id,
                date: dbItem.date.toISOString(),
                year: {
                    content: year,
                    colorClass: getTextClass(color),
                },
                title: {
                    content: dbItem.title,
                    colorClass: getTextClass(color),
                },
                category: {
                    text: dbItem.tag,
                    colorClass: getBadgeClass(color),
                },
                actionVerb: dbItem.actionVerb || undefined,
                description: dbItem.description,
                impact: dbItem.impact || undefined,
                details: dbItem.details || undefined,
                techStack: dbItem.techStack,
                iconName: dbItem.icon?.name ?? 'help-circle',
                employer: dbItem.employer ? {
                    id: dbItem.employer.id,
                    name: dbItem.employer.name,
                    role: dbItem.employer.role,
                } : undefined,
                link: dbItem.linkUrl ? {
                    url: dbItem.linkUrl,
                    text: dbItem.linkText || 'Link',
                } : undefined,
            };
        });
    } catch (error) {
        console.error('Failed to fetch timeline items:', error);
        return [];
    }
}
