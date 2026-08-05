import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PublicResumePage, { generateMetadata as resumeMetadata } from '@/app/u/[username]/resume/page';
import DomainNotBound from '../DomainNotBound';

interface Props {
    params: Promise<{ domain: string }>;
}

async function usernameFor(domain: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { customDomain: domain.toLowerCase() },
        select: { username: true },
    });
    return user?.username ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain } = await params;
    const username = await usernameFor(domain);
    if (!username) return { title: 'Domain not bound' };
    const base = await resumeMetadata({ params: Promise.resolve({ username }) });
    return { ...base, alternates: { canonical: `https://${domain.toLowerCase()}/resume` } };
}

export default async function DomainResumePage({ params }: Props) {
    const { domain } = await params;
    const username = await usernameFor(domain);
    if (!username) return <DomainNotBound domain={domain.toLowerCase()} />;
    return PublicResumePage({ params: Promise.resolve({ username }) });
}
