// Schema.org JSON-LD for the public profile page — lets search engines and
// AI crawlers read "who is this person, what do they know, where do they
// work" as structured data instead of scraping HTML. Pure for testability.

export interface PersonJsonLdInput {
    displayName: string;
    username: string;
    bio: string | null;
    image: string | null;
    profileUrl: string;
    sameAs: string[];
    knowsAbout: string[];
    worksFor: string | null;
}

export function buildPersonJsonLd(p: PersonJsonLdInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
            '@type': 'Person',
            name: p.displayName,
            alternateName: `@${p.username}`,
            url: p.profileUrl,
            ...(p.bio ? { description: p.bio } : {}),
            ...(p.image ? { image: p.image } : {}),
            ...(p.sameAs.length > 0 ? { sameAs: p.sameAs } : {}),
            ...(p.knowsAbout.length > 0 ? { knowsAbout: p.knowsAbout } : {}),
            ...(p.worksFor ? { worksFor: { '@type': 'Organization', name: p.worksFor } } : {}),
        },
    };
}

/** JSON.stringify hardened for inline <script> embedding. */
export function jsonLdString(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
