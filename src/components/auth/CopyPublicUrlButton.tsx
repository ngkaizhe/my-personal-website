'use client';

import { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';

interface Props {
    username: string | null;
}

export function CopyPublicUrlButton({ username }: Props) {
    const [copied, setCopied] = useState(false);

    if (!username) {
        return (
            <a
                href="/setup"
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-border-light transition-colors"
            >
                <LinkIcon className="w-4 h-4" />
                Set a username to share your timeline
            </a>
        );
    }

    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/@${username}`;

    const copy = async () => {
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
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border-light transition-colors cursor-pointer"
            title={`Copy ${url}`}
        >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span className="font-mono">/@{username}</span>
            <span className="text-text-faint">·</span>
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
    );
}
