import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCurrentUserId } from '@/lib/currentUser';
import { fetchYearReview } from '@/lib/yearReview';
import YearReview from '@/components/YearReview/YearReview';

interface Props {
    params: Promise<{ year: string }>;
}

export const metadata = {
    title: 'Year in review',
};

export default async function DashboardYearReviewPage({ params }: Props) {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr, 10);
    if (!Number.isInteger(year) || year < 2000 || year > 3000) notFound();

    const userId = await getCurrentUserId();
    const locale = await getLocale();
    const [data, t] = await Promise.all([
        fetchYearReview(userId, year, locale),
        getTranslations('YearReview'),
    ]);

    const previousYear = year - 1;
    const nextYear = year + 1;
    const currentYear = new Date().getFullYear();

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-text-primary">{t('heading', { year })}</h1>
                        <p className="text-text-muted mt-1">{t('subtitle')}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6 text-sm">
                    <Link
                        href={`/dashboard/year/${previousYear}`}
                        className="inline-flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {previousYear}
                    </Link>
                    {nextYear <= currentYear && (
                        <Link
                            href={`/dashboard/year/${nextYear}`}
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
