'use server';

import { prisma } from '@/lib/prisma';
import { TimelineItem } from '@/components/Timeline/TimelineItem';
import { GraduationCap, Briefcase, Code, Trophy } from 'lucide-react';
import React from 'react';

// Help map category/icon names from DB to Actual Lucide Icons
const iconMap: Record<string, React.ReactNode> = {
    'GraduationCap': <GraduationCap />,
    'Briefcase': <Briefcase />,
    'Code': <Code />,
    'Trophy': <Trophy />,
};

export async function getTimelineItems() {
    try {
        const items = await prisma.timelineItem.findMany({
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
                icon: iconMap[dbItem.categoryText] || <Code />,
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
