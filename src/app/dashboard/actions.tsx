'use server';

import { prisma } from '@/lib/prisma';
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
            return {
                year: {
                    content: dbItem.yearContent,
                    colorClass: dbItem.yearColor,
                },
                title: {
                    content: dbItem.titleContent,
                    colorClass: dbItem.titleColor,
                },
                category: {
                    text: dbItem.categoryText,
                    colorClass: dbItem.categoryColor,
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
