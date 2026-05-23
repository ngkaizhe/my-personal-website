import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { hashSource } from '@/lib/translations';

export const runtime = 'nodejs';

const LOCALE_NAME: Record<string, string> = {
    en: 'English',
    'zh-TW': 'Traditional Chinese (繁體中文, Taiwan)',
};

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
        if (!LOCALE_NAME[sourceLocale] || !LOCALE_NAME[targetLocale]) {
            return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
        }
        if (sourceLocale === targetLocale) {
            return NextResponse.json({ error: 'Source and target locales are the same' }, { status: 400 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
        }

        const systemPrompt = type === 'entry' ? ENTRY_SYSTEM_PROMPT : EXPERIENCE_SYSTEM_PROMPT;
        const userPrompt = `Translate the following ${type} fields from ${LOCALE_NAME[sourceLocale]} to ${LOCALE_NAME[targetLocale]}. Return a JSON object with the same field names.

Source (${sourceLocale}):
${JSON.stringify(source, null, 2)}`;

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            system: [
                {
                    type: 'text',
                    text: systemPrompt,
                    cache_control: { type: 'ephemeral' },
                },
            ],
            messages: [{ role: 'user', content: userPrompt }],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            return NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 });
        }

        const raw = content.text.trim();
        const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
        let translated: Record<string, unknown>;
        try {
            translated = JSON.parse(json);
        } catch {
            console.error('Failed to parse Claude JSON response:', raw);
            return NextResponse.json({ error: 'Model returned invalid JSON', raw }, { status: 500 });
        }

        // Normalise: every field present in source is also present (as string)
        // in the output, defaulting to empty string if the model dropped it.
        const result: Record<string, string> = {};
        for (const key of Object.keys(source)) {
            const val = translated[key];
            result[key] = typeof val === 'string' ? val : '';
        }

        return NextResponse.json({
            translation: result,
            sourceHash: hashSource(source as unknown as Record<string, string>),
        });
    } catch (error) {
        console.error('translate-content error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
