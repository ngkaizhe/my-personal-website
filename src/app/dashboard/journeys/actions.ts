'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface JourneySummary {
    id: string;
    yearContent: string;
    titleContent: string;
    categoryText: string;
    categoryColor: string;
}

export interface JourneyDetail {
    yearContent: string;
    yearColor: string;
    titleContent: string;
    titleColor: string;
    categoryText: string;
    categoryColor: string;
    description: string;
    details: string;
    techStack: string[];
    linkUrl: string;
    linkText: string;
    iconName: string;
}

export async function getJourneySummaries(): Promise<JourneySummary[]> {
    try {
        const items = await prisma.timelineItem.findMany({
            select: {
                id: true,
                yearContent: true,
                titleContent: true,
                categoryText: true,
                categoryColor: true,
            },
            orderBy: { yearContent: 'desc' },
        });
        return items;
    } catch (error) {
        console.error('Failed to fetch journey summaries:', error);
        return [];
    }
}

export async function getJourneyDetail(id: string): Promise<JourneyDetail | null> {
    try {
        const item = await prisma.timelineItem.findUnique({
            where: { id },
            include: { icon: true },
        });
        if (!item) return null;
        return {
            yearContent: item.yearContent,
            yearColor: item.yearColor,
            titleContent: item.titleContent,
            titleColor: item.titleColor,
            categoryText: item.categoryText,
            categoryColor: item.categoryColor,
            description: item.description,
            details: item.details ?? '',
            techStack: item.techStack,
            linkUrl: item.linkUrl ?? '',
            linkText: item.linkText ?? '',
            iconName: item.icon?.name ?? 'help-circle',
        };
    } catch (error) {
        console.error('Failed to fetch journey detail:', error);
        return null;
    }
}

export async function createJourney(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // Process tech stack array
    const techStack = formData.getAll('techStack').map(String).filter(Boolean);

    // Get or create icon
    let iconId = null;
    const iconName = rawData.iconName as string;
    if (iconName) {
        const icon = await prisma.icon.upsert({
            where: { name: iconName },
            update: {},
            create: { name: iconName }
        });
        iconId = icon.id;
    }

    await prisma.timelineItem.create({
        data: {
            yearContent: rawData.yearContent as string,
            yearColor: rawData.yearColor as string,
            titleContent: rawData.titleContent as string,
            titleColor: rawData.titleColor as string,
            categoryText: rawData.categoryText as string,
            categoryColor: rawData.categoryColor as string,
            description: rawData.description as string,
            details: rawData.details ? (rawData.details as string) : null,
            techStack: techStack,
            linkUrl: rawData.linkUrl ? (rawData.linkUrl as string) : null,
            linkText: rawData.linkText ? (rawData.linkText as string) : null,
            iconId: iconId,
        }
    });

    revalidatePath('/dashboard/journeys');
    revalidatePath('/dashboard');
    revalidatePath('/');
    redirect('/dashboard/journeys');
}

export async function updateJourney(id: string, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const techStack = formData.getAll('techStack').map(String).filter(Boolean);

    let iconId = null;
    const iconName = rawData.iconName as string;
    if (iconName) {
        const icon = await prisma.icon.upsert({
            where: { name: iconName },
            update: {},
            create: { name: iconName }
        });
        iconId = icon.id;
    }

    await prisma.timelineItem.update({
        where: { id },
        data: {
            yearContent: rawData.yearContent as string,
            yearColor: rawData.yearColor as string,
            titleContent: rawData.titleContent as string,
            titleColor: rawData.titleColor as string,
            categoryText: rawData.categoryText as string,
            categoryColor: rawData.categoryColor as string,
            description: rawData.description as string,
            details: rawData.details ? (rawData.details as string) : null,
            techStack: techStack,
            linkUrl: rawData.linkUrl ? (rawData.linkUrl as string) : null,
            linkText: rawData.linkText ? (rawData.linkText as string) : null,
            ...(iconId ? { iconId } : {})
        }
    });

    revalidatePath('/dashboard/journeys');
    revalidatePath('/dashboard');
    revalidatePath('/');
    redirect('/dashboard/journeys');
}

export async function deleteJourney(id: string) {
    await prisma.timelineItem.delete({
        where: { id }
    });

    revalidatePath('/dashboard/journeys');
    revalidatePath('/dashboard');
    revalidatePath('/');
}
