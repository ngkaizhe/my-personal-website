import { NextResponse } from 'next/server';
import { hashSource } from '@/lib/translations';
import { guardAiRequest, callClaudeJson } from '@/lib/aiRoute';
import type { Locale } from '@/i18n/locales';

export const runtime = 'nodejs';

// Keyed by Locale so adding a locale to SUPPORTED_LOCALES fails compilation
// here until a display name is provided.
const LOCALE_NAME: Record<Locale, string> = {
    en: 'English',
    'zh-TW': 'Traditional Chinese (繁體中文, Taiwan)',
};

function localeName(value: string): string | null {
    return (LOCALE_NAME as Record<string, string>)[value] ?? null;
}

const ENTRY_SYSTEM_PROMPT = `You translate work-log entry fields between languages for a personal résumé site.

Rules:
- Preserve professional, résumé-appropriate tone.
- Keep technical terms / product names / brand names as-is unless they have a well-known native form.
- 'actionVerb' must stay a single strong past-tense verb when translated (or an empty string if the source is empty).
- 'tag' is a short category label (1–3 words); translate it as a short label, not a sentence.
- Empty source fields stay empty in the output.

Respond with ONLY a JSON object. No prose, no markdown, no code fences.`;

const EXPERIENCE_SYSTEM_PROMPT = `You translate experience header fields between languages for a personal résumé site.

Rules:
- 'organization' is a company / school / project name. Keep proper nouns as-is unless they have a well-known native form.
- 'role' is a job title, education degree, or project role.
- 'description' is one to two short sentences. Professional tone.
- Empty source fields stay empty in the output.

Respond with ONLY a JSON object. No prose, no markdown, no code fences.`;

interface EntrySource {
    title: string;
    actionVerb: string;
    description: string;
    impact: string;
    details: string;
    tag: string;
}

interface ExperienceSource {
    organization: string;
    role: string;
    description: string;
}

export async function POST(request: Request) {
    try {
        const guard = await guardAiRequest('translate-content');
        if (!guard.ok) return guard.response;

        const body = await request.json();
        const { type, source, sourceLocale, targetLocale } = body as {
            type: 'entry' | 'experience';
            source: EntrySource | ExperienceSource;
            sourceLocale: string;
            targetLocale: string;
        };

        if (type !== 'entry' && type !== 'experience') {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
        if (!source || typeof source !== 'object') {
            return NextResponse.json({ error: 'Missing source' }, { status: 400 });
        }
        const sourceName = localeName(sourceLocale);
        const targetName = localeName(targetLocale);
        if (!sourceName || !targetName) {
            return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
        }
        if (sourceLocale === targetLocale) {
            return NextResponse.json({ error: 'Source and target locales are the same' }, { status: 400 });
        }

        const systemPrompt = type === 'entry' ? ENTRY_SYSTEM_PROMPT : EXPERIENCE_SYSTEM_PROMPT;
        const userPrompt = `Translate the following ${type} fields from ${sourceName} to ${targetName}. Return a JSON object with the same field names.

Source (${sourceLocale}):
${JSON.stringify(source, null, 2)}`;

        const result = await callClaudeJson<Record<string, unknown>>({
            system: systemPrompt,
            user: userPrompt,
            maxTokens: 800,
        });
        if (!result.ok) return result.response;
        const translated = result.data;

        // Normalise: every field present in source is also present (as string)
        // in the output, defaulting to empty string if the model dropped it.
        const translation: Record<string, string> = {};
        for (const key of Object.keys(source)) {
            const val = translated[key];
            translation[key] = typeof val === 'string' ? val : '';
        }

        return NextResponse.json({
            translation,
            sourceHash: hashSource(source as unknown as Record<string, string>),
        });
    } catch (error) {
        console.error('translate-content error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
