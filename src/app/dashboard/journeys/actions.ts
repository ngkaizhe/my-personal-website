'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getRawTimelineItems() {
    try {
        return await prisma.timelineItem.findMany({
            include: { icon: true },
            orderBy: { yearContent: 'desc' },
        });
    } catch (error) {
        console.error('Failed to fetch raw timeline items:', error);
        return [];
    }
}

export async function getTimelineItem(id: string) {
    try {
        return await prisma.timelineItem.findUnique({
            where: { id },
            include: { icon: true },
        });
    } catch (error) {
        console.error('Failed to fetch timeline item:', error);
        return null;
    }
}

export async function createTimelineItem(formData: FormData) {
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

export async function updateTimelineItem(id: string, formData: FormData) {
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

export async function deleteTimelineItem(id: string) {
    await prisma.timelineItem.delete({
        where: { id }
    });

    revalidatePath('/dashboard/journeys');
    revalidatePath('/dashboard');
    revalidatePath('/');
}
