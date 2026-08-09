import { headers } from 'next/headers';
import { isMainHost } from '@/lib/customDomain';
import { domainProfile } from '@/lib/domainProfile';

// Host-aware links for the public pages. When a page is being rendered on a
// bound custom domain (via the /d catch-all), internal links must use the
// domain's own path space — /@username/... paths are unmapped there and
// would bounce the visitor to the main app, silently losing the domain.
//
// domainProfile() is React-cached, so this adds no extra query to a /d
// render (the catch-all already resolved the same host).
export interface PublicLinks {
    /** True when rendering on the profile owner's bound custom domain. */
    onDomain: boolean;
    timeline: string;
    resume: string;
    skills: string;
    jsonResume: string;
    year: (year: number | string) => string;
    entry: (id: string) => string;
}

export async function getPublicLinks(username: string): Promise<PublicLinks> {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
    const bare = host.toLowerCase().split(':')[0];

    if (bare && !isMainHost(host)) {
        const profile = await domainProfile(bare);
        if (profile?.username === username) {
            return {
                onDomain: true,
                timeline: profile.timelinePath,
                resume: profile.resumePath,
                skills: '/skills',
                jsonResume: '/resume.json',
                year: (y) => `/year/${y}`,
                entry: (id) => `/entry/${id}`,
            };
        }
    }

    const base = `/@${username}`;
    return {
        onDomain: false,
        timeline: base,
        resume: `${base}/resume`,
        skills: `${base}/skills`,
        jsonResume: `${base}/resume.json`,
        year: (y) => `${base}/year/${y}`,
        entry: (id) => `${base}/entry/${id}`,
    };
}
