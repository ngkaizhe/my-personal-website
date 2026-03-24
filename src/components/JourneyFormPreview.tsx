'use client';

import { TimelineIcon } from '@/components/Timeline/TimelineIcon';
import { getTextClass, getBadgeClass } from '@/lib/colors';

export interface PreviewData {
    year: string;
    title: string;
    tag: string;
    color: string;
    iconName: string;
    description: string;
    details: string;
    techStack: string[];
    linkUrl: string;
    linkText: string;
}

export default function JourneyFormPreview({ data }: { data: PreviewData }) {
    const textClass = getTextClass(data.color);
    const badgeClass = getBadgeClass(data.color);

    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border-4 border-white shadow-lg">
                        <TimelineIcon iconName={data.iconName || 'help-circle'} className={`w-8 h-8 ${textClass}`} />
                    </div>
                    <div>
                        {data.tag && (
                            <span className={`${badgeClass} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                {data.tag}
                            </span>
                        )}
                        <h3 className={`mt-1 font-bold ${textClass} text-3xl`}>
                            {data.year || '2024'}
                        </h3>
                        <p className="text-gray-500">{data.title || 'Untitled'}</p>
                    </div>
                </div>

                {/* Description */}
                <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                    <p className="text-lg leading-relaxed mb-4">
                        {data.description || 'No description yet...'}
                    </p>
                    {data.details && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm leading-relaxed">
                            {data.details}
                        </div>
                    )}
                </div>

                {/* Tech Stack */}
                {data.techStack.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.techStack.map((tag, i) => (
                                <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Link */}
                {data.linkUrl && (
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <span className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-lg shadow-gray-200">
                            {data.linkText || 'Link'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
