'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { LucideIcon } from '@/components/ui/LucideIcon';

export interface EntryCardProps {
    date: string;           // already-formatted for display
    title: string;
    actionVerb?: string;
    tag: string;
    textColorClass: string;
    badgeColorClass: string;
    iconName: string;
    description: string;
    impact?: string;
    details?: string;
    techStack: string[];
    link?: { url: string; text: string } | null;
    employerName?: string;
    employerRole?: string;
    titleId?: string;
}

export default function EntryCard({
    date,
    title,
    actionVerb,
    tag,
    textColorClass,
    badgeColorClass,
    iconName,
    description,
    impact,
    details,
    techStack,
    link,
    employerName,
    employerRole,
    titleId,
}: EntryCardProps) {
    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-elevated border-4 border-surface shadow-lg shrink-0">
                    <LucideIcon iconName={iconName} className={`w-7 h-7 md:w-8 md:h-8 ${textColorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        {tag && (
                            <span data-palette-accent className={`${badgeColorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                {tag}
                            </span>
                        )}
                        <span className="text-xs text-text-muted">{date}</span>
                    </div>
                    <h3 id={titleId} className="mt-1 font-bold text-text-primary text-xl md:text-2xl">
                        {actionVerb && <span data-palette-accent className={`${textColorClass} mr-1.5`}>{actionVerb}</span>}
                        {title}
                    </h3>
                    {employerName && (
                        <p className="text-text-muted text-sm mt-1">
                            {employerRole ? `${employerRole} · ` : ''}{employerName}
                        </p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-text-secondary mb-6">
                <p className="text-base md:text-lg leading-relaxed mb-4">{description}</p>
                {impact && (
                    <div className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-4">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium leading-relaxed">{impact}</span>
                    </div>
                )}
                {details && (
                    <div className="bg-surface-elevated p-4 rounded-lg border border-border-light text-sm leading-relaxed">
                        {details}
                    </div>
                )}
            </div>

            {/* Tech Stack */}
            {techStack.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">Tech / Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {techStack.map((t, i) => (
                            <span key={i} className="bg-badge-bg text-badge-text text-sm px-3 py-1 rounded-full font-medium">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Link */}
            {link && (
                <div className="flex justify-end pt-4 border-t border-border-light">
                    <Link
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-btn-primary-text bg-btn-primary-bg rounded-lg hover:bg-btn-primary-bg-hover transition-all hover:scale-105 shadow-lg"
                        style={{ boxShadow: `0 10px 15px -3px var(--color-btn-primary-shadow)` }}
                    >
                        {link.text}
                    </Link>
                </div>
            )}
        </div>
    );
}
