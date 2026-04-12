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
    employerName?: string;
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
    employerId: string;
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
                employer: { select: { name: true } },
            },
            orderBy: { date: 'asc' },
        });
        return items.map((i) => ({
            id: i.id,
            date: i.date.toISOString(),
            title: i.title,
            tag: i.tag,
            color: i.color,
            employerName: i.employer?.name,
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
            employerId: item.employerId ?? '',
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
        employerId: (raw.employerId as string) || null,
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

export async function getEmployerOptions() {
    try {
        const employers = await prisma.employer.findMany({
            select: { id: true, name: true, role: true },
            orderBy: { startDate: 'desc' },
        });
        return employers;
    } catch (error) {
        console.error('Failed to fetch employer options:', error);
        return [];
    }
}
