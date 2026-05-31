import { Sparkles, Star, BarChart3, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { YearReviewData } from '@/lib/yearReview';

interface Props {
    data: YearReviewData;
    locale: string;
}

export default function YearReview({ data, locale }: Props) {
    const t = useTranslations('YearReview');

    if (!data.hasData) {
        return (
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-12 text-center text-text-muted">
                {t('empty', { year: data.year })}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    label={t('entriesLabel')}
                    value={data.totalEntries}
                    accent="blue"
                />
                <StatCard
                    icon={<Sparkles className="w-5 h-5" />}
                    label={t('impactLabel')}
                    value={data.entriesWithImpact}
                    accent="green"
                />
                <StatCard
                    icon={<Star className="w-5 h-5" />}
                    label={t('featuredLabel')}
                    value={data.featuredCount}
                    accent="amber"
                />
                <StatCard
                    icon={<Award className="w-5 h-5" />}
                    label={t('topTagLabel')}
                    value={data.topTags[0]?.name || '—'}
                    accent="purple"
                    smallValue
                />
            </div>

            {/* Top tags */}
            {data.topTags.length > 0 && (
                <section className="bg-surface rounded-2xl shadow-sm border border-border p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">{t('topTagsHeading')}</h2>
                    <div className="space-y-2">
                        {data.topTags.map((tag, i) => (
                            <div key={tag.name} className="flex items-center gap-3">
                                <span className="text-xs font-mono text-text-faint w-6">#{i + 1}</span>
                                <span className="text-sm font-medium text-text-primary flex-1">{tag.name}</span>
                                <span className="text-xs text-text-muted">
                                    {t('entryCount', { count: tag.count })}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Top skills */}
            {data.topSkills.length > 0 && (
                <section className="bg-surface rounded-2xl shadow-sm border border-border p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">{t('topSkillsHeading')}</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.topSkills.map(s => (
                            <span
                                key={s.name}
                                className="inline-flex items-center gap-1.5 bg-badge-bg text-badge-text text-sm px-3 py-1 rounded-full font-medium"
                            >
                                {s.name}
                                <span className="opacity-60 text-xs">×{s.count}</span>
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Highlights */}
            {data.highlights.length > 0 && (
                <section className="bg-surface rounded-2xl shadow-sm border border-border p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">{t('highlightsHeading')}</h2>
                    <ul className="space-y-3">
                        {data.highlights.map(h => (
                            <li key={h.id} className="border-b border-border-light pb-3 last:border-0 last:pb-0">
                                <div className="text-xs text-text-muted mb-1">
                                    {new Date(h.date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="text-sm">
                                    {h.actionVerb && <span className="font-semibold text-text-primary">{h.actionVerb} </span>}
                                    <span className="text-text-secondary">{h.title}</span>
                                </div>
                                {h.impact && (
                                    <div className="text-xs text-green-700 dark:text-green-400 mt-1">{h.impact}</div>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

function StatCard({
    icon, label, value, accent, smallValue,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    accent: 'blue' | 'green' | 'amber' | 'purple';
    smallValue?: boolean;
}) {
    const accentClasses: Record<typeof accent, string> = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        amber: 'text-amber-500',
        purple: 'text-purple-500',
    };
    return (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4">
            <div className={`flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted mb-2 ${accentClasses[accent]}`}>
                {icon}
                <span className="text-text-muted">{label}</span>
            </div>
            <div className={`font-bold text-text-primary ${smallValue ? 'text-lg' : 'text-3xl'}`}>{value}</div>
        </div>
    );
}
