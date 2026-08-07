import type { Metadata } from 'next';
import { usernameForDomain } from '@/lib/domainProfile';
import PublicResumePage, { generateMetadata as resumeMetadata } from '@/app/u/[username]/resume/page';
import DomainNotBound from '../DomainNotBound';

interface Props {
    params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain } = await params;
    const username = await usernameForDomain(domain);
    if (!username) return { title: 'Domain not bound' };
    const base = await resumeMetadata({ params: Promise.resolve({ username }) });
    return { ...base, alternates: { canonical: `https://${domain.toLowerCase()}/resume` } };
}

export default async function DomainResumePage({ params }: Props) {
    const { domain } = await params;
    const username = await usernameForDomain(domain);
    if (!username) return <DomainNotBound domain={domain.toLowerCase()} />;
    return PublicResumePage({ params: Promise.resolve({ username }) });
}
