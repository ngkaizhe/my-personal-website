import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import ResumeBuilder from '@/components/Resume/ResumeBuilder';
import { prisma } from '@/lib/prisma';
import { fetchResumeByUserId } from '@/lib/resume';
import { resolveDomainPaths } from '@/lib/domainPaths';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { displayName: true, name: true, customDomain: true, domainRootView: true, domainAltPath: true },
    });
    if (!user) return { title: 'Not found' };
    const display = user.displayName || user.name || username;
    return {
        title: `${display} — Résumé`,
        alternates: {
            ...(user.customDomain
                ? { canonical: `https://${user.customDomain}${resolveDomainPaths(user).resumePath}` }
                : {}),
            // Machine-readable variant, so crawlers/agents can discover the
            // JSON Resume without knowing the URL convention.
            types: { 'application/json': `/@${username}/resume.json` },
        },
    };
}

export default async function PublicResumePage({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, displayName: true, name: true, username: true },
    });
    if (!user) notFound();

    const locale = await getLocale();
    const data = await fetchResumeByUserId(user.id, locale);
    const displayName = user.displayName || user.name || `@${user.username}`;
    const t = await getTranslations('PublicProfile');

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col gap-2 no-print">
                    <Link
                        href={`/@${user.username}`}
                        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('backToTimeline', { name: displayName })}
                    </Link>
                    <h1 className="text-3xl font-bold text-text-primary">{t('resumeTitle', { name: displayName })}</h1>
                    <p className="text-text-muted">
                        {t('resumeSubtitle')}
                    </p>
                </div>

                <ResumeBuilder data={data} jsonResumeUrl={`/@${user.username}/resume.json`} />
            </div>
        </div>
    );
}
