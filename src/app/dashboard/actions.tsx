'use server';

import { prisma } from '@/lib/prisma';
import { getTextClass, getBadgeClass } from '@/lib/colors';
import type { TimelineItem } from '@/components/Timeline/TimelineItem';

export async function getTimelineItems() {
    try {
        const items = await prisma.timelineItem.findMany({
            include: {
                icon: true,
            },
            orderBy: {
                yearContent: 'asc',
            },
        });

        return items.map((dbItem: any): TimelineItem => {
            const color = dbItem.color;
            return {
                year: {
                    content: dbItem.yearContent,
                    colorClass: getTextClass(color),
                },
                title: {
                    content: dbItem.titleContent,
                    colorClass: getTextClass(color),
                },
                category: {
                    text: dbItem.categoryText,
                    colorClass: getBadgeClass(color),
                },
                description: dbItem.description,
                details: dbItem.details || undefined,
                techStack: dbItem.techStack,
                // Get the icon name from the related Icon table
                iconName: dbItem.icon.name,
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
