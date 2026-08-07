import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCurrentUserId } from '@/lib/currentUser';
import { fetchSkillsByUserId } from '@/lib/skills';

export const metadata = {
    title: 'Skills',
};

export default async function SkillsPage() {
    const userId = await getCurrentUserId();
    const skills = await fetchSkillsByUserId(userId);
    const t = await getTranslations('Skills');

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{t('heading')}</h1>
                    <p className="text-text-muted mt-2">{t('subtitle')}</p>
                </div>

                {skills.length === 0 ? (
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center text-text-muted">
                        {t('empty')}
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-5 md:p-6">
                        <div className="flex flex-wrap gap-2">
                            {skills.map(s => (
                                <Link
                                    key={s.name}
                                    href={`/dashboard?skill=${encodeURIComponent(s.name)}`}
                                    className="inline-flex items-center gap-2 bg-badge-bg hover:bg-surface-elevated text-badge-text text-sm px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                                >
                                    {s.name}
                                    <span className="opacity-60 text-xs">×{s.count}</span>
                                </Link>
                            ))}
                        </div>
                        <p className="text-xs text-text-faint mt-4">
                            {t('clickHint', { count: skills.length })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
