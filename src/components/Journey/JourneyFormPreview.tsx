'use client';

import { getTextClass, getBadgeClass } from '@/lib/colors';
import JourneyCard from '@/components/Journey/JourneyCard';

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
    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <JourneyCard
                year={data.year || '2024'}
                title={data.title || 'Untitled'}
                tag={data.tag}
                textColorClass={getTextClass(data.color)}
                badgeColorClass={getBadgeClass(data.color)}
                iconName={data.iconName || 'help-circle'}
                description={data.description || 'No description yet...'}
                details={data.details || undefined}
                techStack={data.techStack}
                link={data.linkUrl ? { url: data.linkUrl, text: data.linkText || 'Link' } : null}
            />
        </div>
    );
}
