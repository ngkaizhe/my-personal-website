import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { fetchYearReview } from '@/lib/yearReview';
import YearReview from '@/components/YearReview/YearReview';

interface Props {
    params: Promise<{ username: string; year: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { username, year } = await params;
    return { title: `${year} in review — @${username}` };
}

export default async function PublicYearReviewPage({ params }: Props) {
    const { username, year: yearStr } = await params;
    const year = parseInt(yearStr, 10);
    if (!Number.isInteger(year) || year < 2000 || year > 3000) notFound();

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, displayName: true, name: true, username: true },
    });
    if (!user) notFound();

    const locale = await getLocale();
    const [data, t, tBack] = await Promise.all([
        fetchYearReview(user.id, year, locale),
        getTranslations('YearReview'),
        getTranslations('PublicProfile'),
    ]);

    const displayName = user.displayName || user.name || `@${user.username}`;
    const previousYear = year - 1;
    const nextYear = year + 1;
    const currentYear = new Date().getFullYear();

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <Link
                    href={`/@${user.username}`}
                    className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {tBack('backToTimeline', { name: displayName })}
                </Link>
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-text-primary">{t('publicHeading', { name: displayName, year })}</h1>
                    <p className="text-text-muted mt-1">{t('subtitle')}</p>
                </div>

                <div className="flex items-center justify-between mb-6 text-sm">
                    <Link
                        href={`/@${user.username}/year/${previousYear}`}
                        className="inline-flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {previousYear}
                    </Link>
                    {nextYear <= currentYear && (
                        <Link
                            href={`/@${user.username}/year/${nextYear}`}
                            className="text-text-muted hover:text-text-primary transition-colors"
                        >
                            {nextYear} →
                        </Link>
                    )}
                </div>

                <YearReview data={data} locale={locale} />
            </div>
        </div>
    );
}
