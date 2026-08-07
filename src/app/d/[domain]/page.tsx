import type { Metadata } from 'next';
import { usernameForDomain } from '@/lib/domainProfile';
import PublicProfilePage, { generateMetadata as profileMetadata } from '@/app/u/[username]/page';
import DomainNotBound from './DomainNotBound';

interface Props {
    params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain } = await params;
    const username = await usernameForDomain(domain);
    if (!username) return { title: 'Domain not bound' };
    // Delegate to the /u page's metadata so the two views never drift, then
    // pin the canonical to the custom domain (it, not /u, is the public home).
    const base = await profileMetadata({ params: Promise.resolve({ username }) });
    return { ...base, alternates: { canonical: `https://${domain.toLowerCase()}/` } };
}

export default async function DomainHomePage({ params }: Props) {
    const { domain } = await params;
    const username = await usernameForDomain(domain);
    if (!username) return <DomainNotBound domain={domain.toLowerCase()} />;
    // Server components are plain async functions; calling the /u page
    // directly keeps a single source of truth for the public profile view.
    return PublicProfilePage({ params: Promise.resolve({ username }) });
}
