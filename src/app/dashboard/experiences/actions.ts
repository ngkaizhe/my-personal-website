'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { pickTranslation } from '@/lib/translations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { ExperienceType } from '@/lib/types';

const EXPERIENCE_TYPES: readonly ExperienceType[] = ['JOB', 'EDUCATION', 'PROJECT', 'VOLUNTEER', 'BREAK'] as const;
const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const;

function isExperienceType(value: string): value is ExperienceType {
    return (EXPERIENCE_TYPES as readonly string[]).includes(value);
}

// Display DTO (locale-flattened).
export interface ExperienceSummary {
    id: string;
    type: ExperienceType;
    organization: string;
    role: string | null;
    startDate: string;
    endDate: string | null;
    entryCount: number;
    color: string;
}

// Edit DTO — exposes both translations for the tabbed form.
export interface ExperienceTranslationDraft {
    locale: string;
    organization: string;
    role: string;
    description: string;
    sourceHash: string | null;
    lastTranslatedAt: string | null;
}

export interface ExperienceDetail {
    type: ExperienceType;
    primaryLocale: string;
    startDate: string;     // YYYY-MM-DD
    endDate: string;       // YYYY-MM-DD or empty
    color: string;
    translations: ExperienceTranslationDraft[];
}

const BLANK_EXP_TRANSLATION: Omit<ExperienceTranslationDraft, 'locale'> = {
    organization: '',
    role: '',
    description: '',
    sourceHash: null,
    lastTranslatedAt: null,
};

export async function getExperiences(): Promise<ExperienceSummary[]> {
    const userId = await getCurrentUserId();
    const locale = await getLocale();
    try {
        const experiences = await prisma.experience.findMany({
            where: { userId },
            include: {
                translations: true,
                _count: { select: { entries: true } },
            },
            orderBy: { startDate: 'desc' },
        });
        return experiences.flatMap((e): ExperienceSummary[] => {
            const tr = pickTranslation(e.translations, locale, e.primaryLocale);
            if (!tr) return [];
            return [{
                id: e.id,
                type: e.type,
                organization: tr.organization,
                role: tr.role,
                startDate: e.startDate.toISOString(),
                endDate: e.endDate?.toISOString() ?? null,
                entryCount: e._count.entries,
                color: e.color,
            }];
        });
    } catch (error) {
        console.error('Failed to fetch experiences:', error);
        return [];
    }
}

export async function getExperienceDetail(id: string): Promise<ExperienceDetail | null> {
    const userId = await getCurrentUserId();
    try {
        const experience = await prisma.experience.findFirst({
            where: { id, userId },
            include: { translations: true },
        });
        if (!experience) return null;
        const translations: ExperienceTranslationDraft[] = SUPPORTED_LOCALES.map(locale => {
            const tr = experience.translations.find(t => t.locale === locale);
            if (!tr) return { locale, ...BLANK_EXP_TRANSLATION };
            return {
                locale,
                organization: tr.organization,
                role: tr.role ?? '',
                description: tr.description ?? '',
                sourceHash: tr.sourceHash,
                lastTranslatedAt: tr.lastTranslatedAt?.toISOString() ?? null,
            };
        });
        return {
            type: experience.type,
            primaryLocale: experience.primaryLocale,
            startDate: experience.startDate.toISOString().substring(0, 10),
            endDate: experience.endDate?.toISOString().substring(0, 10) ?? '',
            color: experience.color,
            translations,
        };
    } catch (error) {
        console.error('Failed to fetch experience detail:', error);
        return null;
    }
}

interface ParsedExperienceForm {
    type: ExperienceType;
    primaryLocale: string;
    startDate: Date;
    endDate: Date | null;
    color: string;
    translations: {
        locale: string;
        organization: string;
        role: string | null;
        description: string | null;
    }[];
}

function extractFormData(formData: FormData): ParsedExperienceForm {
    const raw = Object.fromEntries(formData.entries());
    const endDateRaw = raw.endDate as string;
    const typeRaw = (raw.type as string) || 'JOB';
    const type: ExperienceType = isExperienceType(typeRaw) ? typeRaw : 'JOB';
    const primaryLocale = (raw.primaryLocale as string) || 'en';

    const translations = SUPPORTED_LOCALES.map(locale => {
        const get = (field: string) => ((raw[`${field}_${locale}`] as string) ?? '').trim();
        const organization = get('organization');
        const role = get('role');
        const description = get('description');
        return {
            locale,
            organization,
            role: role === '' ? null : role,
            description: description === '' ? null : description,
        };
    }).filter(t => t.organization !== '');

    return {
        type,
        primaryLocale,
        startDate: new Date(raw.startDate as string),
        endDate: endDateRaw ? new Date(endDateRaw) : null,
        color: (raw.color as string) || 'blue',
        translations,
    };
}

export async function createExperience(formData: FormData) {
    const userId = await getCurrentUserId();
    const data = extractFormData(formData);
    if (data.translations.length === 0) {
        throw new Error('Experience must have at least one translation with an organization name.');
    }
    const { translations, ...rest } = data;
    await prisma.experience.create({
        data: {
            ...rest,
            userId,
            translations: { create: translations },
        },
    });
    revalidatePath('/dashboard/experiences');
    revalidatePath('/dashboard/entries');
    redirect('/dashboard/experiences');
}

export interface InlineExperienceOption {
    id: string;
    type: ExperienceType;
    name: string;
    role: string | null;
}

// Used by EntryForm / QuickAdd's inline "+ Create new experience…" modal.
// Captures only one locale (the active one) — the other can be filled in
// later via the regular ExperienceForm + Translate button.
export async function createExperienceInline(formData: FormData): Promise<InlineExperienceOption> {
    const userId = await getCurrentUserId();
    const locale = await getLocale();
    const raw = Object.fromEntries(formData.entries());
    const endDateRaw = raw.endDate as string;
    const typeRaw = (raw.type as string) || 'JOB';
    const type: ExperienceType = isExperienceType(typeRaw) ? typeRaw : 'JOB';
    const organization = ((raw.organization as string) ?? '').trim();
    const roleRaw = ((raw.role as string) ?? '').trim();
    if (organization === '') {
        throw new Error('Organization is required.');
    }
    const created = await prisma.experience.create({
        data: {
            type,
            primaryLocale: locale,
            startDate: new Date(raw.startDate as string),
            endDate: endDateRaw ? new Date(endDateRaw) : null,
            color: (raw.color as string) || 'blue',
            userId,
            translations: {
                create: [{
                    locale,
                    organization,
                    role: roleRaw === '' ? null : roleRaw,
                }],
            },
        },
    });
    revalidatePath('/dashboard/experiences');
    revalidatePath('/dashboard/entries');
    return {
        id: created.id,
        type: created.type,
        name: organization,
        role: roleRaw === '' ? null : roleRaw,
    };
}

export async function updateExperience(id: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const data = extractFormData(formData);
    if (data.translations.length === 0) {
        throw new Error('Experience must have at least one translation with an organization name.');
    }

    const owned = await prisma.experience.findFirst({ where: { id, userId }, select: { id: true } });
    if (!owned) {
        throw new Error('Experience not found or not owned by current user');
    }

    const { translations, ...rest } = data;
    await prisma.experience.update({
        where: { id },
        data: {
            ...rest,
            translations: {
                deleteMany: {},
                create: translations,
            },
        },
    });

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
