'use client';

import { useLocale, useTranslations } from 'next-intl';
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
    attachmentUrls: string[];
    linkUrl: string;
    linkText: string;
    experienceId: string;
}

interface Props {
    data: PreviewData;
    experienceName?: string;
    experienceRole?: string;
}

export default function EntryFormPreview({ data, experienceName, experienceRole }: Props) {
    const t = useTranslations('EntryCard');
    const locale = useLocale();
    const displayDate = data.date
        ? new Date(data.date).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
        : t('previewToday');
    return (
        <div className="bg-surface rounded-xl shadow-2xl overflow-hidden">
            <EntryCard
                date={displayDate}
                title={data.title || t('previewUntitled')}
                actionVerb={data.actionVerb || undefined}
                tag={data.tag}
                textColorClass={getTextClass(data.color)}
                badgeColorClass={getBadgeClass(data.color)}
                iconName={data.iconName || 'help-circle'}
                description={data.description || t('previewNoDescription')}
                impact={data.impact || undefined}
                details={data.details || undefined}
                techStack={data.techStack}
                attachmentUrls={data.attachmentUrls.filter(s => /^https?:\/\//.test(s.trim()))}
                link={data.linkUrl ? { url: data.linkUrl, text: data.linkText || t('previewLinkFallback') } : null}
                experienceName={experienceName}
                experienceRole={experienceRole}
            />
        </div>
    );
}
