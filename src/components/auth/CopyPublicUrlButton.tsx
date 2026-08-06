'use client';

import { useState, useSyncExternalStore } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
    username: string | null;
}

// window.location.origin is a client-only constant: the server snapshot ('')
// keeps SSR markup identical to the first client render (no hydration
// mismatch on the title attribute), and the no-op subscribe is fine because
// the value never changes within a page's lifetime.
const emptySubscribe = () => () => {};
function useOrigin(): string {
    return useSyncExternalStore(
        emptySubscribe,
        () => window.location.origin,
        () => '',
    );
}

export function CopyPublicUrlButton({ username }: Props) {
    const [copied, setCopied] = useState(false);
    const origin = useOrigin();
    const t = useTranslations('Timeline');
    const tAuth = useTranslations('Auth');

    if (!username) {
        return (
            <a
                href="/setup"
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-border-light transition-colors"
            >
                <LinkIcon className="w-4 h-4" />
                {tAuth('setUsernameHint')}
            </a>
        );
    }

    const url = `${origin}/@${username}`;

    const copy = async () => {
        if (!origin) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            disabled={!origin}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border-light transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            title={origin ? tAuth('copyLinkTitle', { url }) : undefined}
        >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span className="font-mono">/@{username}</span>
            <span className="text-text-faint">·</span>
            <span>{copied ? t('copied') : t('copyPublicUrl')}</span>
        </button>
    );
}
