'use client';

import Link from 'next/link';
import { TimelineIcon } from '@/components/Timeline/TimelineIcon';

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
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border-4 border-white shadow-lg">
                    <TimelineIcon iconName={iconName} className={`w-8 h-8 ${textColorClass}`} />
                </div>
                <div>
                    {tag && (
                        <span className={`${badgeColorClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                            {tag}
                        </span>
                    )}
                    <h3 className={`mt-1 font-bold ${textColorClass} text-3xl`}>{year}</h3>
                    <p className="text-gray-500">{title}</p>
                </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                <p className="text-lg leading-relaxed mb-4">{description}</p>
                {details && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm leading-relaxed">
                        {details}
                    </div>
                )}
            </div>

            {/* Tech Stack */}
            {techStack.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                        {techStack.map((tag, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Link */}
            {link && (
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Link
                        href={link.url}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-gray-200"
                    >
                        {link.text}
                    </Link>
                </div>
            )}
        </div>
    );
}
