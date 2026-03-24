'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface JourneySummary {
    id: string;
    year: string;
    title: string;
    tag: string;
    color: string;
}

export interface JourneyDetail {
    year: string;
    title: string;
    tag: string;
    color: string;
    description: string;
    details: string;
    techStack: string[];
    linkUrl: string;
    linkText: string;
    iconName: string;
}

export async function getJourneySummaries(): Promise<JourneySummary[]> {
    try {
        const items = await prisma.journey.findMany({
            select: {
                id: true,
                year: true,
                title: true,
                tag: true,
                color: true,
            },
            orderBy: { year: 'desc' },
        });
        return items;
    } catch (error) {
        console.error('Failed to fetch journey summaries:', error);
        return [];
    }
}

export async function getJourneyDetail(id: string): Promise<JourneyDetail | null> {
    try {
        const item = await prisma.journey.findUnique({
            where: { id },
            include: { icon: true },
        });
        if (!item) return null;
        return {
            year: item.year,
            title: item.title,
            tag: item.tag,
            color: item.color,
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

    await prisma.journey.create({
        data: {
            year: rawData.year as string,
            title: rawData.title as string,
            tag: rawData.tag as string,
            color: rawData.color as string,
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

    await prisma.journey.update({
        where: { id },
        data: {
            year: rawData.year as string,
            title: rawData.title as string,
            tag: rawData.tag as string,
            color: rawData.color as string,
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
    await prisma.journey.delete({
        where: { id }
    });

    revalidatePath('/dashboard/journeys');
    revalidatePath('/dashboard');
    revalidatePath('/');
}
