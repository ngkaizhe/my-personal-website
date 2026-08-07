import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText, Mail, Linkedin, Github, Globe } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Timeline from '@/components/Timeline';
import { prisma } from '@/lib/prisma';
import { fetchTimelineByUserId } from '@/lib/timeline';
import { resolveDomainPaths } from '@/lib/domainPaths';
import { auth } from '@/auth';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { displayName: true, name: true, bio: true, customDomain: true, domainRootView: true, domainAltPath: true },
    });
    if (!user) return { title: 'Not found' };
    const display = user.displayName || user.name || username;
    return {
        title: display,
        description: user.bio || `${display}'s journey timeline.`,
        // When the profile has a bound custom domain, that domain is the
        // canonical home so the /u and /d copies don't compete in search.
        // The path follows the owner's configurable mapping.
        ...(user.customDomain
            ? { alternates: { canonical: `https://${user.customDomain}${resolveDomainPaths(user).timelinePath}` } }
            : {}),
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
            contactEmail: true,
            linkedin: true,
            github: true,
            website: true,
        },
    });
    if (!user) notFound();

    const locale = await getLocale();
    const [timeline, session, t] = await Promise.all([
        fetchTimelineByUserId(user.id, locale),
        auth(),
        getTranslations('PublicProfile'),
    ]);
    const displayName = user.displayName || user.name || `@${user.username}`;
    // Editable when the signed-in viewer owns this profile.
    const editable = session?.user?.id === user.id;

    return (
        <div className="bg-page min-h-screen">
            <section className="max-w-4xl mx-auto px-6 pt-12 pb-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-elevated border border-border-light shrink-0 flex items-center justify-center text-2xl font-semibold text-text-secondary">
                        {user.image ? (
                            // Using a plain <img> instead of next/image because the user
                            // can set this URL to any external host (Gravatar, GitHub, etc).
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={user.image}
                                alt=""
                                referrerPolicy="no-referrer"
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
                        <div className="pt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
                            <Link
                                href={`/@${user.username}/resume`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light text-sm font-medium transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                {t('viewResume')}
                            </Link>
                            {user.contactEmail && (
                                <a
                                    href={`mailto:${user.contactEmail}`}
                                    aria-label={t('contactEmail')}
                                    title={user.contactEmail}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                            )}
                            {user.linkedin && (
                                <a
                                    href={user.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn"
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light transition-colors"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                            {user.github && (
                                <a
                                    href={user.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="GitHub"
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                </a>
                            )}
                            {user.website && (
                                <a
                                    href={user.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t('contactWebsite')}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Timeline items={timeline} editable={editable} />
        </div>
    );
}
