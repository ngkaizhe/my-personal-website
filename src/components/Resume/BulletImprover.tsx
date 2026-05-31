'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import MarkdownText from '@/components/ui/MarkdownText';

interface Props {
    actionVerb: string | null;
    title: string;
    impact: string | null;
    description: string;
}

// Inline AI bullet coach: tiny ✨ button per <li>. Click → fetches an
// improved rewrite + a short feedback note explaining what changed. The
// suggestion is presentational only — we don't write back to the entry.
// User can copy and paste it into the entry edit form themselves.
export default function BulletImprover({ actionVerb, title, impact, description }: Props) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ improved: string; feedback: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations('Resume');

    const improve = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/improve-bullet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionVerb: actionVerb ?? '', title, impact: impact ?? '', description }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || t('improveFailed'));
            }
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('improveFailed'));
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="mt-2 no-print bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <div className="font-medium text-text-primary">{result.improved}</div>
                        {result.feedback && (
                            <div className="text-text-muted mt-1">
                                <MarkdownText inline>{result.feedback}</MarkdownText>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(result.improved);
                            } catch {
                                // ignore — silent fallback
                            }
                        }}
                        title={t('copyImproved')}
                        className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
                        aria-label={t('copyImproved')}
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setResult(null)}
                        className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
                        aria-label={t('dismissImproved')}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <span className="no-print ml-1 inline-flex items-center">
            <button
                type="button"
                onClick={improve}
                disabled={loading}
                title={t('improveBullet')}
                aria-label={t('improveBullet')}
                className="p-0.5 rounded text-text-faint hover:text-blue-500 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
            {error && (
                <span className="text-xs text-red-500 ml-2" role="alert">{error}</span>
            )}
        </span>
    );
}
