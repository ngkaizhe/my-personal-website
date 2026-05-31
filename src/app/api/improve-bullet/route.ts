import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Re-writes a single résumé bullet to STAR shape (Situation / Task / Action /
// Result). Returns the rewrite plus a short feedback note so the user knows
// WHY the original was weak — helps them write better bullets themselves
// next time.
const SYSTEM_PROMPT = `You are a résumé editor specialising in strong action-oriented bullets.

You'll receive a single résumé bullet — composed of an actionVerb, title, optional impact, and optional description — and your job is to rewrite it so it reads stronger on a résumé. Apply the STAR principle implicitly: situation/task should be evident from context, action must be specific, and result should be quantified where possible.

Rules:
- Keep it ONE line, max 200 characters. Résumé bullets aren't paragraphs.
- Lead with a strong past-tense action verb. Vary verbs if the original is generic ("Did", "Worked on", "Helped").
- If the original lacks an impact metric, don't make one up — leave the impact reference vague but compelling (e.g. "improving reliability" instead of inventing "by 47%").
- Preserve technical specifics (tech names, system components). Don't generalize "React" to "a JavaScript library".
- Keep the same language as the input.

Respond with ONLY a JSON object:
{
  "improved": "rewritten bullet as one line",
  "feedback": "one sentence explaining what changed and why"
}

No prose, no markdown, no code fences.`;

interface ImproveBulletRequest {
    actionVerb: string;
    title: string;
    impact?: string;
    description?: string;
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const identifier = session?.user?.id
            || request.headers.get('x-forwarded-for')?.split(',')[0]
            || 'unknown';
        const rl = checkRateLimit(rateLimitKey('improve-bullet', identifier), { max: 30, windowSec: 60 });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
            );
        }

        const body = await request.json() as ImproveBulletRequest;
        const { actionVerb, title, impact, description } = body;
        if (typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
        }

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const userPrompt = JSON.stringify({
            actionVerb: actionVerb || '',
            title,
            impact: impact || '',
            description: description || '',
        }, null, 2);

        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            system: [
                {
                    type: 'text',
                    text: SYSTEM_PROMPT,
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
        let parsed: { improved?: string; feedback?: string };
        try {
            parsed = JSON.parse(json);
        } catch {
            return NextResponse.json({ error: 'Model returned invalid JSON', raw }, { status: 500 });
        }

        return NextResponse.json({
            improved: typeof parsed.improved === 'string' ? parsed.improved : '',
            feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
        });
    } catch (error) {
        console.error('improve-bullet error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
