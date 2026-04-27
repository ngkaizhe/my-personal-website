'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ExperienceSummary {
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate: string | null;
    entryCount: number;
    color: string;
}

export interface ExperienceDetail {
    name: string;
    role: string;
    startDate: string;     // YYYY-MM-DD
    endDate: string;       // YYYY-MM-DD or empty
    description: string;
    color: string;
}

export async function getExperiences(): Promise<ExperienceSummary[]> {
    const userId = await getCurrentUserId();
    try {
        const experiences = await prisma.experience.findMany({
            where: { userId },
            include: { _count: { select: { entries: true } } },
            orderBy: { startDate: 'desc' },
        });
        return experiences.map((e) => ({
            id: e.id,
            name: e.name,
            role: e.role,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate?.toISOString() ?? null,
            entryCount: e._count.entries,
            color: e.color,
        }));
    } catch (error) {
        console.error('Failed to fetch experiences:', error);
        return [];
    }
}

export async function getExperienceDetail(id: string): Promise<ExperienceDetail | null> {
    const userId = await getCurrentUserId();
    try {
        const experience = await prisma.experience.findFirst({ where: { id, userId } });
        if (!experience) return null;
        return {
            name: experience.name,
            role: experience.role,
            startDate: experience.startDate.toISOString().substring(0, 10),
            endDate: experience.endDate?.toISOString().substring(0, 10) ?? '',
            description: experience.description ?? '',
            color: experience.color,
        };
    } catch (error) {
        console.error('Failed to fetch experience detail:', error);
        return null;
    }
}

function extractFormData(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());
    const endDateRaw = raw.endDate as string;
    return {
        name: raw.name as string,
        role: raw.role as string,
        startDate: new Date(raw.startDate as string),
        endDate: endDateRaw ? new Date(endDateRaw) : null,
        description: (raw.description as string) || null,
        color: (raw.color as string) || 'blue',
    };
}

export async function createExperience(formData: FormData) {
    const userId = await getCurrentUserId();
    const data = extractFormData(formData);
    await prisma.experience.create({ data: { ...data, userId } });
    revalidatePath('/dashboard/experiences');
    revalidatePath('/dashboard/entries');
    redirect('/dashboard/experiences');
}

export async function updateExperience(id: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const data = extractFormData(formData);
    const result = await prisma.experience.updateMany({
        where: { id, userId },
        data,
    });
    if (result.count === 0) {
        throw new Error('Experience not found or not owned by current user');
    }
    revalidatePath('/dashboard/experiences');
    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
    redirect('/dashboard/experiences');
}

export async function deleteExperience(id: string) {
    const userId = await getCurrentUserId();
    const result = await prisma.experience.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
        throw new Error('Experience not found or not owned by current user');
    }
    revalidatePath('/dashboard/experiences');
    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
}
