'use client';

import { getTextClass, getBadgeClass } from '@/lib/colors';
import EntryCard from '@/components/Entry/EntryCard';

export interface PreviewData {
    date: string;
    title: string;
    actionVerb: string;
    tag: string;
    color: string;
    iconName: string;
    description: string;
    impact: string;
    details: string;
    techStack: string[];
    linkUrl: string;
    linkText: string;
    employerId: string;
}

interface Props {
    data: PreviewData;
    employerName?: string;
    employerRole?: string;
}

export default function EntryFormPreview({ data, employerName, employerRole }: Props) {
    const displayDate = data.date
        ? new Date(data.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
        : 'Today';
    return (
        <div className="bg-surface rounded-xl shadow-2xl overflow-hidden">
            <EntryCard
                date={displayDate}
                title={data.title || 'Untitled'}
                actionVerb={data.actionVerb || undefined}
                tag={data.tag}
                textColorClass={getTextClass(data.color)}
                badgeColorClass={getBadgeClass(data.color)}
                iconName={data.iconName || 'help-circle'}
                description={data.description || 'No description yet...'}
                impact={data.impact || undefined}
                details={data.details || undefined}
                techStack={data.techStack}
                link={data.linkUrl ? { url: data.linkUrl, text: data.linkText || 'Link' } : null}
                employerName={employerName}
                employerRole={employerRole}
            />
        </div>
    );
}
