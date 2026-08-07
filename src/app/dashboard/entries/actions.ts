'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { iconNames } from '@/lib/iconNames';
import { pickTranslation, tagToSlug, hashSource } from '@/lib/translations';
import { sanitizeHttpUrl, parseFormDate } from '@/lib/urls';
import { SUPPORTED_LOCALES, type Locale as SupportedLocale } from '@/i18n/locales';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

const validIconNames = new Set<string>(iconNames);

// Display DTO (locale-flattened) — what the entries list page renders.
export interface EntrySummary {
    id: string;
    date: string;
    title: string;
    tag: string;
    color: string;
    featured: boolean;
    experienceName?: string;
}

// Edit DTO — exposes both translation rows so the tabbed form can show both
// at once. Missing locales are returned as blank rows so the form always sees
// a consistent shape.
export interface EntryTranslationDraft {
    locale: string;
    title: string;
    actionVerb: string;
    description: string;
    impact: string;
    details: string;
    tag: string;
    sourceHash: string | null;
    lastTranslatedAt: string | null;
    // True when this translation was AI-generated (sourceHash set) but the
    // primary translation has been edited since — the stored hash no longer
    // matches the current source. UI shows a "needs re-translation" badge.
    isStale: boolean;
}

export interface EntryDetail {
    date: string;                // YYYY-MM-DD
    primaryLocale: string;
    color: string;
    featured: boolean;
    techStack: string[];
    attachmentUrls: string[];
    linkUrl: string;
    linkText: string;
    iconName: string;
    experienceId: string;
    translations: EntryTranslationDraft[];
}

const BLANK_TRANSLATION: Omit<EntryTranslationDraft, 'locale'> = {
    title: '',
    actionVerb: '',
    description: '',
    impact: '',
    details: '',
    tag: '',
    sourceHash: null,
    lastTranslatedAt: null,
    isStale: false,
};

function entrySourceFields(tr: {
    title: string;
    actionVerb: string | null;
    description: string;
    impact: string | null;
    details: string | null;
    tag: string;
}): Record<string, string> {
    return {
        title: tr.title,
        actionVerb: tr.actionVerb ?? '',
        description: tr.description,
        impact: tr.impact ?? '',
        details: tr.details ?? '',
        tag: tr.tag,
    };
}

export async function getEntrySummaries(): Promise<EntrySummary[]> {
    const userId = await getCurrentUserId();
    const locale = await getLocale();
    const items = await prisma.entry.findMany({
        where: { userId },
        include: {
            translations: true,
            experience: { include: { translations: true } },
        },
        orderBy: { date: 'asc' },
    });
    return items.flatMap((i): EntrySummary[] => {
        const tr = pickTranslation(i.translations, locale, i.primaryLocale);
        if (!tr) return [];
        const expTr = i.experience
            ? pickTranslation(i.experience.translations, locale, i.experience.primaryLocale)
            : null;
        return [{
            id: i.id,
            date: i.date.toISOString(),
            title: tr.title,
            tag: tr.tag,
            color: i.color,
            featured: i.featured,
            experienceName: expTr?.organization,
        }];
    });
}

export async function getEntryDetail(id: string): Promise<EntryDetail | null> {
    const userId = await getCurrentUserId();
    const item = await prisma.entry.findFirst({
        where: { id, userId },
        include: { icon: true, translations: true },
    });
    if (!item) return null;
    const primaryTr = item.translations.find(t => t.locale === item.primaryLocale);
    const currentSourceHash = primaryTr ? hashSource(entrySourceFields(primaryTr)) : null;
    const translations: EntryTranslationDraft[] = SUPPORTED_LOCALES.map(locale => {
        const tr = item.translations.find(t => t.locale === locale);
        if (!tr) return { locale, ...BLANK_TRANSLATION };
        const isStale = locale !== item.primaryLocale
            && tr.sourceHash != null
            && currentSourceHash != null
            && tr.sourceHash !== currentSourceHash;
        return {
            locale,
            title: tr.title,
            actionVerb: tr.actionVerb ?? '',
            description: tr.description,
            impact: tr.impact ?? '',
            details: tr.details ?? '',
            tag: tr.tag,
            sourceHash: tr.sourceHash,
            lastTranslatedAt: tr.lastTranslatedAt?.toISOString() ?? null,
            isStale,
        };
    });
    return {
        date: item.date.toISOString().substring(0, 10),
        primaryLocale: item.primaryLocale,
        color: item.color,
        featured: item.featured,
        techStack: item.techStack,
        attachmentUrls: item.attachmentUrls,
        linkUrl: item.linkUrl ?? '',
        linkText: item.linkText ?? '',
        iconName: item.icon?.name ?? 'help-circle',
        experienceId: item.experienceId ?? '',
        translations,
    };
}

async function getOrCreateIcon(iconName: string) {
    const name = validIconNames.has(iconName) ? iconName : 'help-circle';
    const icon = await prisma.icon.upsert({
        where: { name },
        update: {},
        create: { name },
    });
    return icon.id;
}

interface ParsedFormData {
    date: Date;
    primaryLocale: string;
    color: string;
    featured: boolean;
    techStack: string[];
    attachmentUrls: string[];
    linkUrl: string | null;
    linkText: string | null;
    experienceId: string | null;
    iconName: string;
    tagSlug: string;
    translations: {
        locale: string;
        title: string;
        actionVerb: string | null;
        description: string;
        impact: string | null;
        details: string | null;
        tag: string;
        sourceHash: string | null;
        lastTranslatedAt: Date | null;
    }[];
}

// Form posts two parallel field sets: title_en + title_zh-TW (etc). We strip
// the suffix and group by locale. Blank locales (no title) are skipped so an
// entry can ship with just one language filled — the other can be added via
// the Translate button later.
function extractFormData(formData: FormData): ParsedFormData {
    const raw = Object.fromEntries(formData.entries());
    const techStack = formData.getAll('techStack').map(String).filter(Boolean);
    // attachmentUrls arrives as a single textarea, newline-separated. We
    // accept http(s) URLs only to avoid javascript:/data: payloads ending up
    // on the public profile.
    const attachmentRaw = ((raw.attachmentUrls as string) ?? '').split(/\r?\n/);
    const attachmentUrls = attachmentRaw
        .map(s => s.trim())
        .filter(s => /^https?:\/\//.test(s));
    const primaryLocale = (raw.primaryLocale as string) || 'en';

    const translations = SUPPORTED_LOCALES.map(locale => {
        const get = (field: string) => ((raw[`${field}_${locale}`] as string) ?? '').trim();
        const sourceHashRaw = ((raw[`sourceHash_${locale}`] as string) ?? '').trim();
        const lastTranslatedAtRaw = ((raw[`lastTranslatedAt_${locale}`] as string) ?? '').trim();
        return {
            locale,
            title: get('title'),
            actionVerb: get('actionVerb') || null,
            description: get('description'),
            impact: get('impact') || null,
            details: get('details') || null,
            tag: get('tag'),
            sourceHash: sourceHashRaw === '' ? null : sourceHashRaw,
            lastTranslatedAt: lastTranslatedAtRaw === '' ? null : new Date(lastTranslatedAtRaw),
        };
    }).filter(t => t.title !== '' && t.description !== '' && t.tag !== '');

    // tagSlug derives from the primary locale's tag, then falls back to
    // whichever translation made it through. If no translation has a tag,
    // the slug is empty — should be impossible given the filter above.
    const primaryTr = translations.find(t => t.locale === primaryLocale);
    const tagSource = primaryTr?.tag || translations[0]?.tag || '';

    const date = parseFormDate(raw.date as string);
    if (!date) {
        throw new Error('Entry date must be a valid YYYY-MM-DD date.');
    }

    return {
        date,
        primaryLocale,
        color: (raw.color as string) || 'blue',
        // HTML checkboxes only post their value when checked; an unchecked
        // box yields no key at all, which becomes false here.
        featured: raw.featured === 'on' || raw.featured === 'true',
        techStack,
        attachmentUrls,
        // Same http(s)-only policy as attachmentUrls: this ends up as an
        // <a href> on the public profile, so javascript:/data: must not pass.
        linkUrl: sanitizeHttpUrl(raw.linkUrl as string),
        linkText: (raw.linkText as string) || null,
        experienceId: (raw.experienceId as string) || null,
        iconName: (raw.iconName as string) || 'help-circle',
        tagSlug: tagToSlug(tagSource),
        translations,
    };
}

export async function createEntry(formData: FormData) {
    const userId = await getCurrentUserId();
    const data = extractFormData(formData);
    if (data.translations.length === 0) {
        throw new Error('Entry must have at least one translation with title, description, and tag.');
    }
    const iconId = await getOrCreateIcon(data.iconName);
    const { iconName: _iconName, translations, ...rest } = data;
    void _iconName;

    await prisma.entry.create({
        data: {
            ...rest,
            userId,
            iconId,
            translations: { create: translations },
        },
    });

    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
    redirect('/dashboard/entries');
}

export async function updateEntry(id: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const data = extractFormData(formData);
    if (data.translations.length === 0) {
        throw new Error('Entry must have at least one translation with title, description, and tag.');
    }

    // Ownership check before nested write — updateMany supports the userId
    // filter inline but can't do nested translations writes, so we verify
    // ownership first and then use update.
    const owned = await prisma.entry.findFirst({ where: { id, userId }, select: { id: true } });
    if (!owned) {
        throw new Error('Entry not found or not owned by current user');
    }

    const iconId = await getOrCreateIcon(data.iconName);
    const { iconName: _iconName, translations, ...rest } = data;
    void _iconName;

    // Translation rows are fully replaced — simpler than tracking which
    // locales changed, and the rows are tiny.
    await prisma.entry.update({
        where: { id },
        data: {
            ...rest,
            iconId,
            translations: {
                deleteMany: {},
                create: translations,
            },
        },
    });

    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
    redirect('/dashboard/entries');
}

export async function deleteEntry(id: string) {
    const userId = await getCurrentUserId();
    const result = await prisma.entry.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
        throw new Error('Entry not found or not owned by current user');
    }
    revalidatePath('/dashboard/entries');
    revalidatePath('/dashboard');
}

// Returned to the inline-create modal and the dropdown — uses the current
// locale to display, with primaryLocale fallback. Caller doesn't need to
// know about the translation table.
export async function getExperienceOptions() {
    const userId = await getCurrentUserId();
    const locale = await getLocale();
    const experiences = await prisma.experience.findMany({
        where: { userId },
        select: {
            id: true,
            type: true,
            primaryLocale: true,
            translations: { select: { locale: true, organization: true, role: true } },
        },
        orderBy: { startDate: 'desc' },
    });
    return experiences.flatMap(e => {
        const tr = pickTranslation(e.translations, locale, e.primaryLocale);
        if (!tr) return [];
        return [{
            id: e.id,
            type: e.type,
            name: tr.organization,
            role: tr.role,
        }];
    });
}
