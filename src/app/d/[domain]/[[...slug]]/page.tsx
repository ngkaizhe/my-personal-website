import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { domainProfile } from '@/lib/domainProfile';
import { mainAppHost } from '@/lib/customDomain';
import PublicProfilePage, { generateMetadata as profileMetadata } from '@/app/u/[username]/page';
import PublicResumePage, { generateMetadata as resumeMetadata } from '@/app/u/[username]/resume/page';
import DomainNotBound from '../DomainNotBound';

// Every path on a bound custom domain lands here (the proxy rewrites the
// whole host into /d/<host>/<path>). This route owns the DB-backed decision:
// render the view mapped to the path, or bounce to the main app.

interface Props {
    params: Promise<{ domain: string; slug?: string[] }>;
}

function pathFromSlug(slug: string[] | undefined): string {
    return `/${(slug ?? []).join('/')}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain, slug } = await params;
    const profile = await domainProfile(domain);
    if (!profile) return { title: 'Domain not bound' };
    const path = pathFromSlug(slug);
    const canonical = `https://${domain.toLowerCase()}${path}`;
    if (path === profile.timelinePath) {
        const base = await profileMetadata({ params: Promise.resolve({ username: profile.username }) });
        return { ...base, alternates: { canonical } };
    }
    if (path === profile.resumePath) {
        const base = await resumeMetadata({ params: Promise.resolve({ username: profile.username }) });
        return { ...base, alternates: { canonical } };
    }
    return { title: 'Redirecting…' };
}

export default async function DomainCatchAllPage({ params }: Props) {
    const { domain, slug } = await params;
    const profile = await domainProfile(domain);
    if (!profile) return <DomainNotBound domain={domain.toLowerCase()} />;

    const path = pathFromSlug(slug);
    if (path === profile.timelinePath) {
        // Server components are plain async functions; calling the /u pages
        // directly keeps a single source of truth for the public views.
        return PublicProfilePage({ params: Promise.resolve({ username: profile.username }) });
    }
    if (path === profile.resumePath) {
        return PublicResumePage({ params: Promise.resolve({ username: profile.username }) });
    }

    // Unmapped path: bounce to the main app, path preserved.
    const appHost = mainAppHost();
    if (appHost) redirect(`https://${appHost}${path}`);
    return <DomainNotBound domain={domain.toLowerCase()} />;
}
