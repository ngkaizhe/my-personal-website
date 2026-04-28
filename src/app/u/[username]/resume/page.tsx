import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ResumeBuilder from '@/components/Resume/ResumeBuilder';
import { prisma } from '@/lib/prisma';
import { fetchResumeByUserId } from '@/lib/resume';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { displayName: true, name: true },
    });
    if (!user) return { title: 'Not found' };
    const display = user.displayName || user.name || username;
    return {
        title: `${display} — Résumé`,
    };
}

export default async function PublicResumePage({ params }: Props) {
    const { username } = await params;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, displayName: true, name: true, username: true },
    });
    if (!user) notFound();

    const data = await fetchResumeByUserId(user.id);
    const displayName = user.displayName || user.name || `@${user.username}`;

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col gap-2">
                    <Link
                        href={`/@${user.username}`}
                        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {displayName}'s timeline
                    </Link>
                    <h1 className="text-3xl font-bold text-text-primary">{displayName} — Résumé</h1>
                    <p className="text-text-muted">
                        Filter by experience and date, then copy the markdown or download a .md file.
                    </p>
                </div>

                <ResumeBuilder data={data} />
            </div>
        </div>
    );
}
