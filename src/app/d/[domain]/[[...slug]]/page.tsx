import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { domainProfile } from '@/lib/domainProfile';
import { mainAppHost } from '@/lib/customDomain';
import PublicProfilePage, { generateMetadata as profileMetadata } from '@/app/u/[username]/page';
import PublicResumePage, { generateMetadata as resumeMetadata } from '@/app/u/[username]/resume/page';
import PublicSkillsPage, { generateMetadata as skillsMetadata } from '@/app/u/[username]/skills/page';
import PublicYearReviewPage, { generateMetadata as yearMetadata } from '@/app/u/[username]/year/[year]/page';
import PublicEntryPage, { generateMetadata as entryMetadata } from '@/app/u/[username]/entry/[id]/page';
import DomainNotBound from '../DomainNotBound';

// Every path on a bound custom domain lands here (the proxy rewrites the
// whole host into /d/<host>/<path>). Resolution order:
//   1. the owner's configurable view mapping (timelinePath / resumePath)
//   2. the fixed public sub-pages (/skills, /year/<n>, /entry/<id>) so the
//      whole public experience stays on the domain — their segments are in
//      RESERVED_PATH_SEGMENTS, so the mapping can never shadow them
//   3. everything else bounces to the main app.

interface Props {
    params: Promise<{ domain: string; slug?: string[] }>;
}

function pathFromSlug(slug: string[] | undefined): string {
    return `/${(slug ?? []).join('/')}`;
}

// Fixed sub-pages served on the domain. Returns the /u page function +
// metadata function + params for the matched route, or null.
function matchSubPage(slug: string[] | undefined, username: string) {
    const s = slug ?? [];
    if (s.length === 1 && s[0] === 'skills') {
        return {
            page: () => PublicSkillsPage({ params: Promise.resolve({ username }) }),
            metadata: () => skillsMetadata({ params: Promise.resolve({ username }) }),
        };
    }
    if (s.length === 2 && s[0] === 'year' && /^\d{4}$/.test(s[1])) {
        return {
            page: () => PublicYearReviewPage({ params: Promise.resolve({ username, year: s[1] }) }),
            metadata: () => yearMetadata({ params: Promise.resolve({ username, year: s[1] }) }),
        };
    }
    if (s.length === 2 && s[0] === 'entry' && /^[0-9a-f-]{36}$/.test(s[1])) {
        return {
            page: () => PublicEntryPage({ params: Promise.resolve({ username, id: s[1] }) }),
            metadata: () => entryMetadata({ params: Promise.resolve({ username, id: s[1] }) }),
        };
    }
    return null;
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
    const sub = matchSubPage(slug, profile.username);
    if (sub) {
        const base = await sub.metadata();
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
    const sub = matchSubPage(slug, profile.username);
    if (sub) return sub.page();

    // Unmapped path: bounce to the main app, path preserved.
    const appHost = mainAppHost();
    if (appHost) redirect(`https://${appHost}${path}`);
    return <DomainNotBound domain={domain.toLowerCase()} />;
}
