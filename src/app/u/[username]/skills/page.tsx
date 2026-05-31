import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { aggregateSkills } from '@/lib/skills';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username } = await params;
    return { title: `Skills — @${username}` };
}

export default async function PublicSkillsPage({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            displayName: true,
            name: true,
            username: true,
            entries: { select: { techStack: true } },
        },
    });
    if (!user) notFound();

    const skills = aggregateSkills(user.entries.map(e => e.techStack));
    const t = await getTranslations('Skills');
    const tBack = await getTranslations('PublicProfile');
    const displayName = user.displayName || user.name || `@${user.username}`;

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Link
                    href={`/@${user.username}`}
                    className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {tBack('backToTimeline', { name: displayName })}
                </Link>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('publicHeading', { name: displayName })}</h1>
                    <p className="text-text-muted mt-2">{t('publicSubtitle')}</p>
                </div>

                {skills.length === 0 ? (
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center text-text-muted">
                        {t('empty')}
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-5 md:p-6">
                        <div className="flex flex-wrap gap-2">
                            {skills.map(s => (
                                <Link
                                    key={s.name}
                                    href={`/@${user.username}?skill=${encodeURIComponent(s.name)}`}
                                    className="inline-flex items-center gap-2 bg-badge-bg hover:bg-surface-elevated text-badge-text text-sm px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                                >
                                    {s.name}
                                    <span className="opacity-60 text-xs">×{s.count}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
