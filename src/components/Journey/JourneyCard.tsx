'use client';

import Link from 'next/link';
import { LucideIcon } from '@/components/ui/LucideIcon';

export interface JourneyCardProps {
    year: string;
    title: string;
    tag: string;
    textColorClass: string;
    badgeColorClass: string;
    iconName: string;
    description: string;
    details?: string;
    techStack: string[];
    link?: { url: string; text: string } | null;
}

export default function JourneyCard({ year, title, tag, textColorClass, badgeColorClass, iconName, description, details, techStack, link }: JourneyCardProps) {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-elevated border-4 border-surface shadow-lg">
                    <LucideIcon iconName={iconName} className={`w-8 h-8 ${textColorClass}`} />
                </div>
                <div>
                    {tag && (
                        <span className={`${badgeColorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                            {tag}
                        </span>
                    )}
                    <h3 className={`mt-1 font-bold ${textColorClass} text-3xl`}>{year}</h3>
                    <p className="text-text-muted">{title}</p>
                </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-text-secondary mb-6">
                <p className="text-lg leading-relaxed mb-4">{description}</p>
                {details && (
                    <div className="bg-surface-elevated p-4 rounded-lg border border-border-light text-sm leading-relaxed">
                        {details}
                    </div>
                )}
            </div>

            {/* Tech Stack */}
            {techStack.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-text-primary mb-2 uppercase tracking-wide">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                        {techStack.map((tag, i) => (
                            <span key={i} className="bg-badge-bg text-badge-text text-sm px-3 py-1 rounded-full font-medium">
                                {tag}
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
