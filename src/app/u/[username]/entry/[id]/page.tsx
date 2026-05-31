import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import EntryCard from '@/components/Entry/EntryCard';
import { prisma } from '@/lib/prisma';
import { pickTranslation } from '@/lib/translations';
import { getTextClass, getBadgeClass } from '@/lib/colors';

interface Props {
    params: Promise<{ username: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username, id } = await params;
    const entry = await prisma.entry.findFirst({
        where: { id, user: { username } },
        select: { primaryLocale: true, translations: true },
    });
    if (!entry) return { title: 'Not found' };
    const tr = pickTranslation(entry.translations, 'en', entry.primaryLocale);
    if (!tr) return { title: 'Not found' };
    const titleLine = tr.actionVerb ? `${tr.actionVerb} ${tr.title}` : tr.title;
    return {
        title: `${titleLine} — @${username}`,
        description: tr.description,
        openGraph: {
            title: titleLine,
            description: tr.description,
            type: 'article',
        },
    };
}

export default async function PublicEntryPage({ params }: Props) {
    const { username, id } = await params;
    const locale = await getLocale();

    const entry = await prisma.entry.findFirst({
        where: { id, user: { username } },
        include: {
            icon: true,
            translations: true,
            experience: { include: { translations: true } },
            user: { select: { username: true, displayName: true, name: true } },
        },
    });
    if (!entry) notFound();

    const tr = pickTranslation(entry.translations, locale, entry.primaryLocale);
    if (!tr) notFound();

    const expTr = entry.experience
        ? pickTranslation(entry.experience.translations, locale, entry.experience.primaryLocale)
        : null;

    const tBack = await getTranslations('PublicProfile');
    const displayName = entry.user.displayName || entry.user.name || `@${entry.user.username}`;
    const formattedDate = new Date(entry.date).toLocaleDateString(locale, {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="bg-page min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Link
                    href={`/@${entry.user.username}`}
                    className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {tBack('backToTimeline', { name: displayName })}
                </Link>
                <div className="bg-surface rounded-2xl shadow-2xl overflow-hidden">
                    <EntryCard
                        date={formattedDate}
                        title={tr.title}
                        actionVerb={tr.actionVerb ?? undefined}
                        tag={tr.tag}
                        textColorClass={getTextClass(entry.color)}
                        badgeColorClass={getBadgeClass(entry.color)}
                        iconName={entry.icon?.name ?? 'help-circle'}
                        description={tr.description}
                        impact={tr.impact ?? undefined}
                        details={tr.details ?? undefined}
                        techStack={entry.techStack}
                        link={entry.linkUrl ? { url: entry.linkUrl, text: entry.linkText ?? 'Link' } : null}
                        experienceName={expTr?.organization}
                        experienceRole={expTr?.role ?? undefined}
                    />
                </div>
            </div>
        </div>
    );
}
