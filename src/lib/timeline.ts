import { prisma } from '@/lib/prisma';
import { getTextClass, getBadgeClass } from '@/lib/colors';
import { pickTranslation } from '@/lib/translations';
import type { TimelineItem } from '@/lib/types';

export async function fetchTimelineByUserId(userId: string, locale: string): Promise<TimelineItem[]> {
    const items = await prisma.entry.findMany({
        where: { userId },
        include: {
            icon: true,
            translations: true,
            experience: {
                include: { translations: true },
            },
        },
        orderBy: { date: 'asc' },
    });

    return items.flatMap((dbItem): TimelineItem[] => {
        const tr = pickTranslation(dbItem.translations, locale, dbItem.primaryLocale);
        if (!tr) return []; // entry with zero translations is invalid; skip it

        let experience: TimelineItem['experience'] = undefined;
        if (dbItem.experience) {
            const expTr = pickTranslation(
                dbItem.experience.translations,
                locale,
                dbItem.experience.primaryLocale,
            );
            if (expTr) {
                experience = {
                    id: dbItem.experience.id,
                    type: dbItem.experience.type,
                    organization: expTr.organization,
                    role: expTr.role,
                };
            }
        }

        return [{
            id: dbItem.id,
            date: dbItem.date.toISOString(),
            year: {
                content: dbItem.date.getFullYear().toString(),
                colorClass: getTextClass(dbItem.color),
            },
            title: {
                content: tr.title,
                colorClass: getTextClass(dbItem.color),
            },
            category: {
                text: tr.tag,
                colorClass: getBadgeClass(dbItem.color),
            },
            actionVerb: tr.actionVerb || undefined,
            description: tr.description,
            impact: tr.impact || undefined,
            details: tr.details || undefined,
            techStack: dbItem.techStack,
            attachmentUrls: dbItem.attachmentUrls,
            iconName: dbItem.icon?.name ?? 'help-circle',
            experience,
            link: dbItem.linkUrl ? {
                url: dbItem.linkUrl,
                text: dbItem.linkText || 'Link',
            } : undefined,
            fellBackFromPrimary: tr.locale !== locale,
        }];
    });
}
