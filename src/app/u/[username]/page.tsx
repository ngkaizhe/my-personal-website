import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Timeline from '@/components/Timeline';
import { prisma } from '@/lib/prisma';
import { fetchTimelineByUserId } from '@/lib/timeline';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { displayName: true, name: true, bio: true },
    });
    if (!user) return { title: 'Not found' };
    const display = user.displayName || user.name || username;
    return {
        title: display,
        description: user.bio || `${display}'s journey timeline.`,
        openGraph: {
            title: display,
            description: user.bio || `${display}'s journey timeline.`,
            type: 'profile',
        },
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            name: true,
            displayName: true,
            bio: true,
            image: true,
            username: true,
        },
    });
    if (!user) notFound();

    const timeline = await fetchTimelineByUserId(user.id);
    const displayName = user.displayName || user.name || `@${user.username}`;
    const t = await getTranslations('PublicProfile');

    return (
        <div className="bg-page min-h-screen">
            <section className="max-w-4xl mx-auto px-6 pt-12 pb-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-elevated border border-border-light shrink-0 flex items-center justify-center text-2xl font-semibold text-text-secondary">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt=""
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span aria-hidden="true">{displayName[0]?.toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                            {displayName}
                        </h1>
                        <p className="text-text-muted text-sm font-mono">@{user.username}</p>
                        {user.bio && (
                            <p className="text-text-secondary text-base leading-relaxed max-w-2xl">{user.bio}</p>
                        )}
                        <div className="pt-2 flex justify-center md:justify-start">
                            <Link
                                href={`/@${user.username}/resume`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light text-sm font-medium transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                {t('viewResume')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Timeline items={timeline} />
        </div>
    );
}
