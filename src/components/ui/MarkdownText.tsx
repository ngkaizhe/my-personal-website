'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Thin wrapper around react-markdown with our project's typography. Used in
// EntryCard for description / details / impact so users can write **bold**,
// *italics*, lists, [links](...) and inline `code` without losing the
// résumé-friendly plain look.
//
// We intentionally don't enable rehype-raw — raw HTML in entries is a
// stored-XSS waiting to happen on the public /@username pages. react-markdown
// strips it by default and we keep it that way.

interface Props {
    children: string;
    className?: string;
    inline?: boolean;
}

export default function MarkdownText({ children, className, inline = false }: Props) {
    if (!children) return null;
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Inline mode skips wrapper <p> tags (which would break
                    // flex/grid alignment inside spans and badges). We strip
                    // the paragraph to its children.
                    p: ({ children: c }) => inline ? <>{c}</> : <p className="mb-2 last:mb-0">{c}</p>,
                    a: ({ children: c, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline"
                        >
                            {c}
                        </a>
                    ),
                    ul: ({ children: c }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{c}</ul>,
                    ol: ({ children: c }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{c}</ol>,
                    li: ({ children: c }) => <li>{c}</li>,
                    code: ({ children: c }) => (
                        <code className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border-light text-xs font-mono">
                            {c}
                        </code>
                    ),
                    pre: ({ children: c }) => (
                        <pre className="p-3 rounded-lg bg-surface-elevated border border-border-light overflow-x-auto text-xs font-mono mb-2 last:mb-0">
                            {c}
                        </pre>
                    ),
                    strong: ({ children: c }) => <strong className="font-semibold text-text-primary">{c}</strong>,
                    em: ({ children: c }) => <em className="italic">{c}</em>,
                    h1: ({ children: c }) => <h4 className="text-base font-bold text-text-primary mt-3 mb-1">{c}</h4>,
                    h2: ({ children: c }) => <h4 className="text-base font-bold text-text-primary mt-3 mb-1">{c}</h4>,
                    h3: ({ children: c }) => <h4 className="text-sm font-bold text-text-primary mt-2 mb-1">{c}</h4>,
                    blockquote: ({ children: c }) => (
                        <blockquote className="border-l-2 border-border pl-3 italic text-text-muted mb-2 last:mb-0">
                            {c}
                        </blockquote>
                    ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
