import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { iconNames } from '@/lib/iconNames';
import { COLOR_KEYS } from '@/lib/colors';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are an assistant that converts free-form work-log sentences into a structured JSON entry for a personal achievement timeline.

Given a user's one-line description of something they did at work (or for themselves), extract:

- actionVerb: a single strong past-tense verb that starts a resume bullet (e.g. "Shipped", "Reduced", "Led", "Migrated", "Designed", "Automated"). Pick the most accurate one.
- title: a concise noun-phrase title describing WHAT was done (without the action verb). 5–12 words. Title case.
- description: 1–2 sentences explaining the context or approach. Professional tone. Max 200 characters.
- impact: a quantified outcome if the user mentioned one (e.g. "Reduced bundle size by 40KB"). If no metric was mentioned, set to empty string "".
- tag: a short category label (e.g. "Engineering", "DevOps", "Leadership", "Design", "Career Growth", "Learning"). 1–3 words.
- techStack: an array of distinct technologies/skills demonstrated. Keep short, canonical names ("React", "TypeScript", "PostgreSQL"). Empty array if none.
- color: pick one color key from this allowed list based on the nature of the work. Engineering → blue/indigo, DevOps → cyan/teal, leadership → purple, design → pink, learning → green, bug fix → red. ALLOWED: ${COLOR_KEYS.join(', ')}
- iconName: pick one Lucide icon name (kebab-case) that best matches the work. ALLOWED: pick from any of the provided icon names. Good defaults: "code", "rocket", "package", "zap", "git-branch", "book-open", "users", "wrench", "bug", "shield". If unsure, use "sparkles".

Respond with ONLY a JSON object. No prose, no markdown, no code fences. Example:
{"actionVerb":"Shipped","title":"Dark mode with three themes","description":"...","impact":"","tag":"Engineering","techStack":["React","CSS"],"color":"blue","iconName":"moon"}`;

interface ParsedEntry {
    actionVerb: string;
    title: string;
    description: string;
    impact: string;
    tag: string;
    techStack: string[];
    color: string;
    iconName: string;
}

export async function POST(request: Request) {
    try {
        const { text } = await request.json();
        if (typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ error: 'Missing or invalid "text" field' }, { status: 400 });
        }
        if (text.length > 2000) {
            return NextResponse.json({ error: 'Text too long (max 2000 chars)' }, { status: 400 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
        }

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 600,
            system: [
                {
                    type: 'text',
                    text: SYSTEM_PROMPT,
                    cache_control: { type: 'ephemeral' },
                },
            ],
            messages: [
                { role: 'user', content: text },
            ],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            return NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 });
        }

        const raw = content.text.trim();
        // Strip markdown code fence if the model wrapped the JSON anyway
        const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();

        let parsed: ParsedEntry;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            console.error('Failed to parse Claude JSON response:', raw);
            return NextResponse.json({ error: 'Model returned invalid JSON', raw }, { status: 500 });
        }

        // Validate and sanitize
        const safeColor = COLOR_KEYS.includes(parsed.color) ? parsed.color : 'blue';
        const safeIcon = iconNames.includes(parsed.iconName) ? parsed.iconName : 'sparkles';

        return NextResponse.json({
            actionVerb: parsed.actionVerb || '',
            title: parsed.title || '',
            description: parsed.description || '',
            impact: parsed.impact || '',
            tag: parsed.tag || 'Entry',
            techStack: Array.isArray(parsed.techStack) ? parsed.techStack.filter(Boolean) : [],
            color: safeColor,
            iconName: safeIcon,
        });
    } catch (error) {
        console.error('parse-entry error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
