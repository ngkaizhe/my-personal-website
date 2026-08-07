import { NextResponse } from 'next/server';
import { guardAiRequest, callClaudeJson } from '@/lib/aiRoute';

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
        const guard = await guardAiRequest('improve-bullet');
        if (!guard.ok) return guard.response;

        const body = await request.json() as ImproveBulletRequest;
        const { actionVerb, title, impact, description } = body;
        if (typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        const result = await callClaudeJson<{ improved?: string; feedback?: string }>({
            system: SYSTEM_PROMPT,
            user: JSON.stringify({
                actionVerb: actionVerb || '',
                title,
                impact: impact || '',
                description: description || '',
            }, null, 2),
            maxTokens: 500,
        });
        if (!result.ok) return result.response;

        return NextResponse.json({
            improved: typeof result.data.improved === 'string' ? result.data.improved : '',
            feedback: typeof result.data.feedback === 'string' ? result.data.feedback : '',
        });
    } catch (error) {
        console.error('improve-bullet error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
