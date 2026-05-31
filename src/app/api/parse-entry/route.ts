import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { iconNames } from '@/lib/iconNames';
import { COLOR_KEYS } from '@/lib/colors';

export const runtime = 'nodejs';

// Total turns from initial parse → refinement. Each turn = one Claude call.
// We force done=true after MAX_TURNS to bound cost + UX.
const MAX_TURNS = 3;

const INITIAL_SYSTEM_PROMPT = `You are an assistant that converts free-form work-log sentences into a structured JSON entry for a personal achievement timeline.

Given a user's one-line description of something they did at work (or for themselves), extract:

- actionVerb: a single strong past-tense verb that starts a resume bullet (e.g. "Shipped", "Reduced", "Led", "Migrated", "Designed", "Automated"). Pick the most accurate one.
- title: a concise noun-phrase title describing WHAT was done (without the action verb). 5–12 words. Title case.
- description: 1–2 sentences explaining the context or approach. Professional tone. Max 200 characters.
- impact: a quantified outcome if the user mentioned one (e.g. "Reduced bundle size by 40KB"). If no metric was mentioned, set to empty string "".
- details: optional longer-form context (background, approach, lessons). Empty string if nothing extra.
- tag: a short category label (e.g. "Engineering", "DevOps", "Leadership", "Design", "Career Growth", "Learning"). 1–3 words.
- techStack: an array of distinct technologies/skills demonstrated. Keep short, canonical names ("React", "TypeScript", "PostgreSQL"). Empty array if none.
- color: pick one color key from this allowed list based on the nature of the work. Engineering → blue/indigo, DevOps → cyan/teal, leadership → purple, design → pink, learning → green, bug fix → red. ALLOWED: ${COLOR_KEYS.join(', ')}
- iconName: pick one Lucide icon name (kebab-case) that best matches the work. ALLOWED: pick from any of the provided icon names. Good defaults: "code", "rocket", "package", "zap", "git-branch", "book-open", "users", "wrench", "bug", "shield". If unsure, use "sparkles".

Also generate "questions": an array of 0–3 follow-up questions targeting weak or empty fields. Each question has:
  - id: one of "impact" | "details" | "techStack" | "description" | "general"
  - label: the question phrased naturally in the same language as the user's input
  - placeholder: short example answer to hint at what's expected

Only ask about a field if it's empty or vague after your best-effort extraction. Don't ask about fields the user already covered. Don't ask more than 3 questions. If everything looks complete, return questions: [].

Respond with ONLY a JSON object with the entry fields above plus "questions". No prose, no markdown, no code fences.`;

const REFINEMENT_SYSTEM_PROMPT = `You are refining an existing structured work-log entry with the user's new answers to your follow-up questions.

You'll receive:
  - "previousState": the current entry fields
  - "originalText": the user's first one-line description
  - "answers": an object mapping question id → user's new text answer

Use the answers to UPDATE the corresponding fields in previousState. Only change fields that the answers actually affect — don't rewrite fields the user didn't speak to. Preserve the user's edits to previousState (assume they may have hand-edited a field; respect it unless their answer overrides it).

Then optionally ask 1-2 more follow-up questions if the entry is still notably incomplete. If it's good, return questions: [].

Same JSON schema as the initial parse:
  - actionVerb, title, description, impact, details, tag, techStack, color, iconName
  - questions: array of { id, label, placeholder }

Respond with ONLY a JSON object. No prose, no markdown, no code fences.`;

interface ParsedEntry {
    actionVerb: string;
    title: string;
    description: string;
    impact: string;
    details: string;
    tag: string;
    techStack: string[];
    color: string;
    iconName: string;
    questions?: Array<{ id: string; label: string; placeholder?: string }>;
}

const VALID_QUESTION_IDS = new Set(['impact', 'details', 'techStack', 'description', 'general']);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            text,
            previousState,
            answers,
            turn,
        } = body as {
            text?: string;
            previousState?: Partial<ParsedEntry>;
            answers?: Record<string, string>;
            turn?: number;
        };

        const currentTurn = typeof turn === 'number' ? turn : 1;
        const isRefinement = previousState && answers;

        if (!isRefinement) {
            if (typeof text !== 'string' || !text.trim()) {
                return NextResponse.json({ error: 'Missing or invalid "text" field' }, { status: 400 });
            }
            if (text.length > 2000) {
                return NextResponse.json({ error: 'Text too long (max 2000 chars)' }, { status: 400 });
            }
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
        }

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const systemPrompt = isRefinement ? REFINEMENT_SYSTEM_PROMPT : INITIAL_SYSTEM_PROMPT;
        const userPrompt = isRefinement
            ? JSON.stringify({ previousState, originalText: text ?? '', answers }, null, 2)
            : (text as string);

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
            messages: [
                { role: 'user', content: userPrompt },
            ],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            return NextResponse.json({ error: 'Unexpected response type from Claude' }, { status: 500 });
        }

        const raw = content.text.trim();
        const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();

        let parsed: ParsedEntry;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            console.error('Failed to parse Claude JSON response:', raw);
            return NextResponse.json({ error: 'Model returned invalid JSON', raw }, { status: 500 });
        }

        // Validate and sanitize core fields
        const safeColor = COLOR_KEYS.includes(parsed.color) ? parsed.color : 'blue';
        const safeIcon = iconNames.includes(parsed.iconName) ? parsed.iconName : 'sparkles';

        // Hard-cap questions: max 3, drop unknown ids, force done after MAX_TURNS.
        const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
        const questions = currentTurn >= MAX_TURNS
            ? []
            : rawQuestions
                .filter(q => q && typeof q.id === 'string' && typeof q.label === 'string' && VALID_QUESTION_IDS.has(q.id))
                .slice(0, 3)
                .map(q => ({
                    id: q.id,
                    label: q.label,
                    placeholder: typeof q.placeholder === 'string' ? q.placeholder : '',
                }));

        return NextResponse.json({
            actionVerb: parsed.actionVerb || '',
            title: parsed.title || '',
            description: parsed.description || '',
            impact: parsed.impact || '',
            details: parsed.details || '',
            tag: parsed.tag || 'Entry',
            techStack: Array.isArray(parsed.techStack) ? parsed.techStack.filter(Boolean) : [],
            color: safeColor,
            iconName: safeIcon,
            questions,
            done: questions.length === 0,
            turn: currentTurn,
        });
    } catch (error) {
        console.error('parse-entry error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
