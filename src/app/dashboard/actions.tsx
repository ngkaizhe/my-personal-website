'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { getTextClass, getBadgeClass } from '@/lib/colors';
import type { TimelineItem } from '@/lib/types';

export async function getTimelineItems(): Promise<TimelineItem[]> {
    const userId = await getCurrentUserId();
    try {
        const items = await prisma.entry.findMany({
            where: { userId },
            include: {
                icon: true,
                experience: true,
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
                experience: dbItem.experience ? {
                    id: dbItem.experience.id,
                    name: dbItem.experience.name,
                    role: dbItem.experience.role,
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
