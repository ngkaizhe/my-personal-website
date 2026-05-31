'use client';

import { useState, useMemo, useRef } from 'react';
import { Copy, Check, Download, Printer, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ResumeData, ResumeEntry, ResumeExperience } from '@/app/dashboard/resume/actions';
import type { ExperienceType } from '@/lib/types';
import { aggregateSkills } from '@/lib/skills';

// Ordering for sections in the résumé output. BREAK is rendered together with
// the "Other" bucket alongside unlinked entries.
const SECTION_TYPES: ExperienceType[] = ['JOB', 'EDUCATION', 'PROJECT', 'VOLUNTEER'];

const SECTION_KEY: Record<ExperienceType, string> = {
    JOB: 'sectionExperience',
    EDUCATION: 'sectionEducation',
    PROJECT: 'sectionProjects',
    VOLUNTEER: 'sectionVolunteer',
    BREAK: 'sectionOther',
};

const inputClass = `
    w-full px-4 py-2.5 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
`;

function formatExperienceRange(start: string, end: string | null, locale: string, presentLabel: string) {
    const s = new Date(start).toLocaleDateString(locale, { year: 'numeric', month: 'short' });
    const e = end ? new Date(end).toLocaleDateString(locale, { year: 'numeric', month: 'short' }) : presentLabel;
    return `${s} – ${e}`;
}

function bulletFromEntry(entry: ResumeEntry): string {
    const parts: string[] = [];
    const verb = entry.actionVerb?.trim();
    if (verb) parts.push(verb);
    parts.push(entry.title);
    let line = parts.join(' ');
    if (entry.impact) line += ` — ${entry.impact}`;
    if (entry.techStack.length > 0) line += ` *(${entry.techStack.join(', ')})*`;
    return `- ${line}`;
}

function inRange(iso: string, from: string, to: string) {
    const d = new Date(iso).getTime();
    if (from && d < new Date(from).getTime()) return false;
    if (to && d > new Date(to).getTime() + 86400000) return false;
    return true;
}

export default function ResumeBuilder({ data }: { data: ResumeData }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(
        new Set(['unlinked', ...data.experiences.map(e => e.id)])
    );
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
    const markdownRef = useRef<HTMLTextAreaElement>(null);
    const t = useTranslations('Resume');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const presentLabel = tCommon('present');

    const toggleExperience = (id: string) => {
        setSelectedExperiences(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filtered = useMemo(() => {
        const entryPredicate = (e: ResumeEntry) =>
            inRange(e.date, from, to) && (!featuredOnly || e.featured);

        const experiences: ResumeExperience[] = data.experiences
            .filter(exp => selectedExperiences.has(exp.id))
            .map(exp => ({
                ...exp,
                entries: exp.entries.filter(entryPredicate),
            }))
            .filter(exp => exp.entries.length > 0);

        const unlinked = selectedExperiences.has('unlinked')
            ? data.unlinkedEntries.filter(entryPredicate)
            : [];

        const allEntries = [...experiences.flatMap(e => e.entries), ...unlinked];
        const skills = aggregateSkills(allEntries.map(e => e.techStack));

        return { experiences, unlinked, skills };
    }, [data, from, to, selectedExperiences, featuredOnly]);

    const grouped = useMemo(() => {
        const byType: Record<ExperienceType, ResumeExperience[]> = {
            JOB: [],
            EDUCATION: [],
            PROJECT: [],
            VOLUNTEER: [],
            BREAK: [],
        };
        for (const exp of filtered.experiences) {
            byType[exp.type].push(exp);
        }
        return byType;
    }, [filtered.experiences]);

    const markdown = useMemo(() => {
        const lines: string[] = [];

        const writeExperience = (exp: ResumeExperience) => {
            const header = exp.role ? `${exp.organization} — ${exp.role}` : exp.organization;
            lines.push(`## ${header}`);
            lines.push(`*${formatExperienceRange(exp.startDate, exp.endDate, locale, presentLabel)}*`);
            if (exp.description) {
                lines.push('');
                lines.push(exp.description);
            }
            lines.push('');
            for (const entry of exp.entries) {
                lines.push(bulletFromEntry(entry));
            }
            lines.push('');
        };

        for (const type of SECTION_TYPES) {
            if (grouped[type].length === 0) continue;
            lines.push(`# ${t(SECTION_KEY[type])}`);
            lines.push('');
            for (const exp of grouped[type]) writeExperience(exp);
        }

        // BREAK + unlinked entries share an "Other" section.
        const otherExperiences = grouped.BREAK;
        if (otherExperiences.length > 0 || filtered.unlinked.length > 0) {
            lines.push(`# ${t('sectionOther')}`);
            lines.push('');
            for (const exp of otherExperiences) writeExperience(exp);
            for (const entry of filtered.unlinked) {
                lines.push(bulletFromEntry(entry));
            }
            lines.push('');
        }

        if (filtered.skills.length > 0) {
            lines.push(`# ${t('skills')}`);
            lines.push('');
            lines.push(filtered.skills.map(s => s.name).join(' · '));
            lines.push('');
        }

        return lines.join('\n').trim();
    }, [grouped, filtered.unlinked, filtered.skills, t, locale, presentLabel]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(markdown);
            setCopyState('copied');
            setTimeout(() => setCopyState('idle'), 2000);
        } catch {
            // Clipboard API can reject under HTTP, sandboxed iframes, or strict
            // permission policies. Fall back to selecting the textarea so the
            // user can finish the copy with Ctrl/Cmd+C.
            const ta = markdownRef.current;
            if (ta) {
                ta.focus();
                ta.select();
            }
            setCopyState('manual');
            setTimeout(() => setCopyState('idle'), 4000);
        }
    };

    const download = () => {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${new Date().toISOString().substring(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start resume-print-page">
            {/* Filters */}
            <div className="bg-form-bg backdrop-blur-sm p-5 rounded-2xl border border-form-border space-y-5 resume-print-hide">
                <h2 className="text-lg font-semibold text-form-section-text border-b border-form-section-border pb-2">
                    {t('filtersTitle')}
                </h2>

                <div>
                    <label className="block text-sm font-medium text-form-label mb-2">{t('include')}</label>
                    <div className="space-y-2">
                        {data.experiences.map(exp => (
                            <label key={exp.id} className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedExperiences.has(exp.id)}
                                    onChange={() => toggleExperience(exp.id)}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="font-medium text-text-primary">{exp.organization}</span>
                                    <span className="text-text-muted block text-xs">{t('entriesCount', { count: exp.entries.length })}</span>
                                </span>
                            </label>
                        ))}
                        <label className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedExperiences.has('unlinked')}
                                onChange={() => toggleExperience('unlinked')}
                                className="mt-0.5"
                            />
                            <span>
                                <span className="font-medium text-text-primary">{t('unlinkedOption')}</span>
                                <span className="text-text-muted block text-xs">{t('entriesCount', { count: data.unlinkedEntries.length })}</span>
                            </span>
                        </label>
                    </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={e => setFeaturedOnly(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-blue-600"
                    />
                    <span>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-form-label">
                            <Star className={`w-4 h-4 ${featuredOnly ? 'fill-amber-400 text-amber-400' : 'text-text-faint'}`} />
                            {t('featuredOnly')}
                        </span>
                        <span className="block text-xs text-text-faint mt-0.5">{t('featuredOnlyHint')}</span>
                    </span>
                </label>

                <div>
                    <label htmlFor="from" className="block text-sm font-medium text-form-label mb-2">{t('from')}</label>
                    <input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="to" className="block text-sm font-medium text-form-label mb-2">{t('to')}</label>
                    <input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
                </div>

                <div className="pt-3 border-t border-form-section-border space-y-2">
                    <button
                        type="button"
                        onClick={copy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer"
                    >
                        {copyState === 'copied' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copyState === 'copied'
                            ? t('copied')
                            : copyState === 'manual'
                                ? t('copyManual')
                                : t('copyMarkdown')}
                    </button>
                    <button
                        type="button"
                        onClick={download}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-colors cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        {t('downloadMd')}
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-colors cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        {t('printPdf')}
                    </button>
                    <span role="status" aria-live="polite" className="sr-only">
                        {copyState === 'copied'
                            ? t('copySrCopied')
                            : copyState === 'manual'
                                ? t('copySrManual')
                                : ''}
                    </span>
                </div>
            </div>

            {/* Preview + markdown */}
            <div className="space-y-6">
                <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 md:p-8">
                    <h2 className="text-lg font-semibold text-text-primary border-b border-border-light pb-2 mb-4 no-print">
                        {t('preview')}
                    </h2>

                    {filtered.experiences.length === 0 && filtered.unlinked.length === 0 ? (
                        <p className="text-text-muted text-center py-12">{t('noMatching')}</p>
                    ) : (
                        <div className="space-y-8">
                            {SECTION_TYPES.map((type) => {
                                const list = grouped[type];
                                if (list.length === 0) return null;
                                return (
                                    <section key={type} className="space-y-4">
                                        <h3 className="text-2xl font-bold text-text-primary">{t(SECTION_KEY[type])}</h3>
                                        {list.map(exp => (
                                            <div key={exp.id} className="space-y-2">
                                                <div>
                                                    <div className="font-bold text-text-primary text-lg">
                                                        {exp.organization}
                                                        {exp.role && <span className="text-text-secondary font-medium"> — {exp.role}</span>}
                                                    </div>
                                                    <div className="text-text-muted text-sm italic">{formatExperienceRange(exp.startDate, exp.endDate, locale, presentLabel)}</div>
                                                </div>
                                                {exp.description && <p className="text-text-secondary text-sm">{exp.description}</p>}
                                                <ul className="space-y-1.5 pl-5 list-disc marker:text-text-muted">
                                                    {exp.entries.map(e => (
                                                        <li key={e.id} className="text-text-secondary text-sm">
                                                            {e.actionVerb && <span className="font-semibold text-text-primary">{e.actionVerb} </span>}
                                                            {e.title}
                                                            {e.impact && <span className="text-green-700 dark:text-green-400"> — {e.impact}</span>}
                                                            {e.techStack.length > 0 && (
                                                                <span className="text-text-muted italic"> ({e.techStack.join(', ')})</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </section>
                                );
                            })}
                            {(grouped.BREAK.length > 0 || filtered.unlinked.length > 0) && (
                                <section className="space-y-4">
                                    <h3 className="text-2xl font-bold text-text-primary">{t('sectionOther')}</h3>
                                    {grouped.BREAK.map(exp => (
                                        <div key={exp.id} className="space-y-2">
                                            <div>
                                                <div className="font-bold text-text-primary text-lg">
                                                    {exp.organization}
                                                    {exp.role && <span className="text-text-secondary font-medium"> — {exp.role}</span>}
                                                </div>
                                                <div className="text-text-muted text-sm italic">{formatExperienceRange(exp.startDate, exp.endDate, locale, presentLabel)}</div>
                                            </div>
                                            {exp.description && <p className="text-text-secondary text-sm">{exp.description}</p>}
                                            <ul className="space-y-1.5 pl-5 list-disc marker:text-text-muted">
                                                {exp.entries.map(e => (
                                                    <li key={e.id} className="text-text-secondary text-sm">
                                                        {e.actionVerb && <span className="font-semibold text-text-primary">{e.actionVerb} </span>}
                                                        {e.title}
                                                        {e.impact && <span className="text-green-700 dark:text-green-400"> — {e.impact}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                    {filtered.unlinked.length > 0 && (
                                        <ul className="space-y-1.5 pl-5 list-disc marker:text-text-muted">
                                            {filtered.unlinked.map(e => (
                                                <li key={e.id} className="text-text-secondary text-sm">
                                                    {e.actionVerb && <span className="font-semibold text-text-primary">{e.actionVerb} </span>}
                                                    {e.title}
                                                    {e.impact && <span className="text-green-700 dark:text-green-400"> — {e.impact}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )}
                            {filtered.skills.length > 0 && (
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary mb-2">{t('skills')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {filtered.skills.map(s => (
                                            <span key={s.name} className="bg-badge-bg text-badge-text text-sm px-3 py-1 rounded-full font-medium">
                                                {s.name} <span className="opacity-60">×{s.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="resume-print-hide">
                    <label htmlFor="md" className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wide block">
                        {t('markdown')}
                    </label>
                    <textarea
                        ref={markdownRef}
                        id="md"
                        readOnly
                        value={markdown}
                        rows={14}
                        onClick={(e) => e.currentTarget.select()}
                        className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-input-text font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}
