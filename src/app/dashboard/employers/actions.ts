'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface EmployerSummary {
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate: string | null;
    entryCount: number;
    color: string;
}

export interface EmployerDetail {
    name: string;
    role: string;
    startDate: string;     // YYYY-MM-DD
    endDate: string;       // YYYY-MM-DD or empty
    description: string;
    color: string;
}

export async function getEmployers(): Promise<EmployerSummary[]> {
    try {
        const employers = await prisma.employer.findMany({
            include: { _count: { select: { entries: true } } },
            orderBy: { startDate: 'desc' },
        });
        return employers.map((e) => ({
            id: e.id,
            name: e.name,
            role: e.role,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate?.toISOString() ?? null,
            entryCount: e._count.entries,
            color: e.color,
        }));
    } catch (error) {
        console.error('Failed to fetch employers:', error);
        return [];
    }
}

export async function getEmployerDetail(id: string): Promise<EmployerDetail | null> {
    try {
        const employer = await prisma.employer.findUnique({ where: { id } });
        if (!employer) return null;
        return {
            name: employer.name,
            role: employer.role,
            startDate: employer.startDate.toISOString().substring(0, 10),
            endDate: employer.endDate?.toISOString().substring(0, 10) ?? '',
            description: employer.description ?? '',
            color: employer.color,
        };
    } catch (error) {
        console.error('Failed to fetch employer detail:', error);
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

export async function createEmployer(formData: FormData) {
    const data = extractFormData(formData);
    await prisma.employer.create({ data });
    revalidatePath('/dashboard/employers');
    revalidatePath('/dashboard/entries');
    redirect('/dashboard/employers');
}

export async function updateEmployer(id: string, formData: FormData) {
    const data = extractFormData(formData);
    await prisma.employer.update({ where: { id }, data });
    revalidatePath('/dashboard/employers');
    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
    redirect('/dashboard/employers');
}

export async function deleteEmployer(id: string) {
    await prisma.employer.delete({ where: { id } });
    revalidatePath('/dashboard/employers');
    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
}
