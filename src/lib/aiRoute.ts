import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

// Shared plumbing for the three Anthropic-backed routes (parse-entry,
// improve-bullet, translate-content). Centralises the auth requirement, the
// per-user rate limit, the missing-key 503, and the call-Claude-expect-JSON
// dance so the routes only contain their prompt + response shaping.

export const AI_MODEL = 'claude-haiku-4-5-20251001';
const RATE_LIMIT = { max: 30, windowSec: 60 };

type Guard =
    | { ok: true; userId: string }
    | { ok: false; response: NextResponse };

/**
 * Auth + rate limit + config gate. All AI routes require a signed-in user:
 * these calls cost real money, so anonymous traffic gets a 401 (mirrors
 * upload-image). Rate limiting keys off the user id.
 */
export async function guardAiRequest(routeName: string): Promise<Guard> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Sign in required' }, { status: 401 }),
        };
    }

    const rl = checkRateLimit(rateLimitKey(routeName, userId), RATE_LIMIT);
    if (!rl.ok) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Rate limit exceeded. Try again shortly.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rl.retryAfter),
                        'X-RateLimit-Remaining': '0',
                    },
                },
            ),
        };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'AI features not configured' }, { status: 503 }),
        };
    }

    return { ok: true, userId };
}

type ClaudeJson<T> =
    | { ok: true; data: T }
    | { ok: false; response: NextResponse };

/**
 * One Claude round-trip that must come back as a JSON object. The system
 * prompt is ephemerally cached (stable across calls); code fences are
 * stripped defensively even though the prompts forbid them.
 */
export async function callClaudeJson<T>(opts: {
    system: string;
    user: string;
    maxTokens: number;
}): Promise<ClaudeJson<T>> {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: opts.maxTokens,
        system: [
            {
                type: 'text',
                text: opts.system,
                cache_control: { type: 'ephemeral' },
            },
        ],
        messages: [{ role: 'user', content: opts.user }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 }),
        };
    }

    const raw = content.text.trim();
    const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
    try {
        return { ok: true, data: JSON.parse(json) as T };
    } catch {
        console.error('Claude returned invalid JSON:', raw);
        return {
            ok: false,
            response: NextResponse.json({ error: 'Model returned invalid JSON', raw }, { status: 500 }),
        };
    }
}
