'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface EntrySummary {
    id: string;
    date: string;
    title: string;
    tag: string;
    color: string;
    experienceName?: string;
}

export interface EntryDetail {
    date: string;               // YYYY-MM-DD
    title: string;
    actionVerb: string;
    description: string;
    impact: string;
    details: string;
    tag: string;
    color: string;
    techStack: string[];
    linkUrl: string;
    linkText: string;
    iconName: string;
    experienceId: string;
}

export async function getEntrySummaries(): Promise<EntrySummary[]> {
    try {
        const items = await prisma.entry.findMany({
            select: {
                id: true,
                date: true,
                title: true,
                tag: true,
                color: true,
                experience: { select: { name: true } },
            },
            orderBy: { date: 'asc' },
        });
        return items.map((i) => ({
            id: i.id,
            date: i.date.toISOString(),
            title: i.title,
            tag: i.tag,
            color: i.color,
            experienceName: i.experience?.name,
        }));
    } catch (error) {
        console.error('Failed to fetch entry summaries:', error);
        return [];
    }
}

export async function getEntryDetail(id: string): Promise<EntryDetail | null> {
    try {
        const item = await prisma.entry.findUnique({
            where: { id },
            include: { icon: true },
        });
        if (!item) return null;
        return {
            date: item.date.toISOString().substring(0, 10),
            title: item.title,
            actionVerb: item.actionVerb ?? '',
            description: item.description,
            impact: item.impact ?? '',
            details: item.details ?? '',
            tag: item.tag,
            color: item.color,
            techStack: item.techStack,
            linkUrl: item.linkUrl ?? '',
            linkText: item.linkText ?? '',
            iconName: item.icon?.name ?? 'help-circle',
            experienceId: item.experienceId ?? '',
        };
    } catch (error) {
        console.error('Failed to fetch entry detail:', error);
        return null;
    }
}

async function getOrCreateIcon(iconName: string) {
    const name = iconName || 'help-circle';
    const icon = await prisma.icon.upsert({
        where: { name },
        update: {},
        create: { name },
    });
    return icon.id;
}

function extractFormData(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());
    const techStack = formData.getAll('techStack').map(String).filter(Boolean);
    return {
        date: new Date(raw.date as string),
        title: raw.title as string,
        actionVerb: (raw.actionVerb as string) || null,
        description: raw.description as string,
        impact: (raw.impact as string) || null,
        details: (raw.details as string) || null,
        tag: raw.tag as string,
        color: raw.color as string,
        techStack,
        linkUrl: (raw.linkUrl as string) || null,
        linkText: (raw.linkText as string) || null,
        experienceId: (raw.experienceId as string) || null,
        iconName: (raw.iconName as string) || 'help-circle',
    };
}

export async function createEntry(formData: FormData) {
    const data = extractFormData(formData);
    const iconId = await getOrCreateIcon(data.iconName);
    const { iconName: _iconName, ...rest } = data;
    void _iconName;

    await prisma.entry.create({
        data: { ...rest, iconId },
    });

    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
    redirect('/dashboard/entries');
}

export async function updateEntry(id: string, formData: FormData) {
    const data = extractFormData(formData);
    const iconId = await getOrCreateIcon(data.iconName);
    const { iconName: _iconName, ...rest } = data;
    void _iconName;

    await prisma.entry.update({
        where: { id },
        data: { ...rest, iconId },
    });

    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
    redirect('/dashboard/entries');
}

export async function deleteEntry(id: string) {
    await prisma.entry.delete({ where: { id } });
    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
}

export async function getExperienceOptions() {
    try {
        const experiences = await prisma.experience.findMany({
            select: { id: true, name: true, role: true },
            orderBy: { startDate: 'desc' },
        });
        return experiences;
    } catch (error) {
        console.error('Failed to fetch experience options:', error);
        return [];
    }
}
