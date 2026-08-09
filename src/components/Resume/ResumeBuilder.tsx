'use client';

import { useState, useMemo, useCallback } from 'react';
import { Download, Printer, Star, ChevronRight, Braces } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ResumeData, ResumeEntry, ResumeExperience } from '@/app/dashboard/resume/actions';
import type { ExperienceType } from '@/lib/types';
import { aggregateSkills } from '@/lib/skills';
import BulletImprover from '@/components/Resume/BulletImprover';
import { inputClassCompact } from '@/lib/formStyles';
import { groupSkills } from '@/lib/skillCategories';

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

export interface ResumeHeader {
    name: string;
    /** Avatar/photo URL — rendered at the right of the header, toggleable
     *  from the filters (photos are the norm for TW résumés, discouraged for
     *  US/ATS ones, so the owner decides per print). */
    image?: string | null;
    contactEmail?: string | null;
    github?: string | null;
    linkedin?: string | null;
    website?: string | null;
}

interface ResumeBuilderProps {
    data: ResumeData;
    /** Professional summary paragraph rendered under the header — caller
     *  resolves it for the current locale. The résumé language is bound to
     *  the site locale (use the global language toggle to switch). */
    summary?: string | null;
    /** Enables the per-bullet "Improve" AI coaching button. Caller decides
     *  based on (aiAvailable && viewer-owns-the-resume). */
    canImproveBullets?: boolean;
    /** Link to the machine-readable JSON Resume for this profile (shown as a
     *  button in the actions column when provided). */
    jsonResumeUrl?: string;
    /** Name + contact links rendered at the top of the preview (and the
     *  markdown/PDF) — the printed résumé must carry its own contact info. */
    header?: ResumeHeader;
}

/** "https://www.github.com/x" -> "github.com/x" for compact display/print. */
function bareUrl(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

function contactItems(header: ResumeHeader): { label: string; href: string }[] {
    return [
        header.contactEmail ? { label: header.contactEmail, href: `mailto:${header.contactEmail}` } : null,
        header.github ? { label: bareUrl(header.github), href: header.github } : null,
        header.linkedin ? { label: bareUrl(header.linkedin), href: header.linkedin } : null,
        header.website ? { label: bareUrl(header.website), href: header.website } : null,
    ].filter((i): i is { label: string; href: string } => i !== null);
}

export default function ResumeBuilder({ data, summary = null, canImproveBullets = false, jsonResumeUrl, header }: ResumeBuilderProps) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(
        new Set(['unlinked', ...data.experiences.map(e => e.id)])
    );
    // Defaults ON: the résumé is the curated view (starred entries only);
    // visitors can untick to see everything.
    const [featuredOnly, setFeaturedOnly] = useState(true);
    const [showPhoto, setShowPhoto] = useState(true);
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

    // Filter conditions are locale-independent (experience/entry ids match
    // across translations), so the same function serves the active preview
    // AND on-demand builds of the other language for download.
    const computeFiltered = useCallback((d: ResumeData) => {
        const entryPredicate = (e: ResumeEntry) =>
            inRange(e.date, from, to) && (!featuredOnly || e.featured);

        const experiences: ResumeExperience[] = d.experiences
            .filter(exp => selectedExperiences.has(exp.id))
            .map(exp => ({
                ...exp,
                entries: exp.entries.filter(entryPredicate),
            }))
            .filter(exp => exp.entries.length > 0);

        const unlinked = selectedExperiences.has('unlinked')
            ? d.unlinkedEntries.filter(entryPredicate)
            : [];

        const allEntries = [...experiences.flatMap(e => e.entries), ...unlinked];
        const skills = aggregateSkills(allEntries.map(e => e.techStack));

        return { experiences, unlinked, skills };
    }, [from, to, selectedExperiences, featuredOnly]);

    const filtered = useMemo(() => computeFiltered(data), [computeFiltered, data]);

    const groupByType = (experiences: ResumeExperience[]) => {
        const byType: Record<ExperienceType, ResumeExperience[]> = {
            JOB: [],
            EDUCATION: [],
            PROJECT: [],
            VOLUNTEER: [],
            BREAK: [],
        };
        for (const exp of experiences) {
            byType[exp.type].push(exp);
        }
        return byType;
    };

    const grouped = useMemo(() => groupByType(filtered.experiences), [filtered.experiences]);

    const markdown = useMemo(() => {
        const lines: string[] = [];

        if (header) {
            lines.push(`# ${header.name}`);
            const contacts = contactItems(header);
            if (contacts.length > 0) {
                lines.push('');
                lines.push(contacts.map(c => c.label).join(' · '));
            }
            lines.push('');
        }
        if (summary) {
            lines.push(summary);
            lines.push('');
        }

        const writeExperience = (exp: ResumeExperience) => {
            const head = exp.role ? `${exp.organization} — ${exp.role}` : exp.organization;
            lines.push(`## ${head}`);
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
        if (grouped.BREAK.length > 0 || filtered.unlinked.length > 0) {
            lines.push(`# ${t('sectionOther')}`);
            lines.push('');
            for (const exp of grouped.BREAK) writeExperience(exp);
            for (const entry of filtered.unlinked) {
                lines.push(bulletFromEntry(entry));
            }
            lines.push('');
        }

        if (filtered.skills.length > 0) {
            lines.push(`# ${t('skills')}`);
            lines.push('');
            for (const group of groupSkills(filtered.skills)) {
                lines.push(`- **${t(`skillCat_${group.key}`)}**: ${group.skills.map(s => s.name).join(' · ')}`);
            }
            lines.push('');
        }

        return lines.join('\n').trim();
    }, [grouped, filtered.unlinked, filtered.skills, t, locale, presentLabel, header, summary]);

    const download = () => {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${locale === 'zh-TW' ? 'zh' : 'en'}-${new Date().toISOString().substring(0, 10)}.md`;
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
                        {data.unlinkedEntries.length > 0 && (
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
                        )}
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

                {header?.image && (
                    <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showPhoto}
                            onChange={e => setShowPhoto(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-blue-600"
                        />
                        <span>
                            <span className="text-sm font-medium text-form-label">{t('showPhoto')}</span>
                            <span className="block text-xs text-text-faint mt-0.5">{t('showPhotoHint')}</span>
                        </span>
                    </label>
                )}

                <div>
                    <label htmlFor="from" className="block text-sm font-medium text-form-label mb-2">{t('from')}</label>
                    <input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClassCompact} />
                </div>
                <div>
                    <label htmlFor="to" className="block text-sm font-medium text-form-label mb-2">{t('to')}</label>
                    <input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClassCompact} />
                </div>

                <div className="pt-3 border-t border-form-section-border space-y-2">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        {locale === 'zh-TW' ? t('printPdfZh') : t('printPdfEn')}
                    </button>
                    <button
                        type="button"
                        onClick={download}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-colors cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        {locale === 'zh-TW' ? t('downloadMdZh') : t('downloadMdEn')}
                    </button>
                    {jsonResumeUrl && (
                        <a
                            href={jsonResumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-colors cursor-pointer"
                        >
                            <Braces className="w-4 h-4" />
                            {t('jsonResume')}
                        </a>
                    )}
                </div>
            </div>

            {/* Preview + markdown */}
            <div className="space-y-6">
                <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 md:p-8 resume-print-hide">
                    <h2 className="text-lg font-semibold text-text-primary border-b border-border-light pb-2 mb-4 no-print">
                        {t('preview')}
                    </h2>

                    {header && (
                        <header className="mb-8 pb-6 border-b border-border-light flex items-start justify-between gap-6">
                            <div className="min-w-0">
                            <h2 className="text-3xl font-bold text-text-primary">{header.name}</h2>
                            {contactItems(header).length > 0 && (
                                <p className="mt-2 text-sm text-text-secondary flex flex-wrap gap-x-2 gap-y-1">
                                    {contactItems(header).map((c, i) => (
                                        <span key={c.href} className="inline-flex items-center gap-2">
                                            {i > 0 && <span className="text-text-faint" aria-hidden="true">·</span>}
                                            <a
                                                href={c.href}
                                                target={c.href.startsWith('mailto:') ? undefined : '_blank'}
                                                rel="noopener noreferrer"
                                                className="hover:text-text-primary hover:underline underline-offset-2 transition-colors"
                                            >
                                                {c.label}
                                            </a>
                                        </span>
                                    ))}
                                </p>
                            )}
                            {summary && (
                                <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-3xl">{summary}</p>
                            )}
                            </div>
                            {header.image && showPhoto && (
                                // Plain <img>: the URL points at whatever external
                                // host the user configured (LinkedIn, GitHub, …).
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={header.image}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-28 h-28 rounded-xl object-cover border border-border-light shrink-0"
                                />
                            )}
                        </header>
                    )}
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
                                                            {canImproveBullets && (
                                                                <BulletImprover
                                                                    actionVerb={e.actionVerb}
                                                                    title={e.title}
                                                                    impact={e.impact}
                                                                    description={e.description}
                                                                />
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
                                                        {canImproveBullets && (
                                                            <BulletImprover
                                                                actionVerb={e.actionVerb}
                                                                title={e.title}
                                                                impact={e.impact}
                                                                description={e.description}
                                                            />
                                                        )}
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
                                                    {canImproveBullets && (
                                                        <BulletImprover
                                                            actionVerb={e.actionVerb}
                                                            title={e.title}
                                                            impact={e.impact}
                                                            description={e.description}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )}
                            {filtered.skills.length > 0 && (
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary mb-3">{t('skills')}</h3>
                                    <div className="space-y-2.5">
                                        {groupSkills(filtered.skills).map(group => (
                                            <div key={group.key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                                <span className="sm:w-40 shrink-0 text-sm font-semibold text-text-secondary">
                                                    {t(`skillCat_${group.key}`)}
                                                </span>
                                                <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                                                    {group.skills.map((s, i) => (
                                                        <span key={s.name} className="text-sm text-text-secondary">
                                                            {i > 0 && <span className="text-text-faint mr-2" aria-hidden="true">·</span>}
                                                            {s.name}
                                                            {s.count >= 2 && <span className="text-text-faint text-xs ml-0.5">×{s.count}</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <details className="resume-print-hide group">
                    <summary className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wide cursor-pointer select-none list-none inline-flex items-center gap-1.5 hover:text-text-primary transition-colors">
                        <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                        {t('markdown')}
                    </summary>
                    <textarea
                        id="md"
                        readOnly
                        value={markdown}
                        rows={14}
                        onClick={(e) => e.currentTarget.select()}
                        className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-input-text font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                </details>
            </div>

            {/* Dedicated print layout (two-column sidebar style, industry
                conventions: ~32% light sidebar, single accent color, uppercase
                letterspaced section titles). Hidden on screen; the screen
                preview above is hidden in print. */}
            <div className="print-only resume-print-doc">
                <aside className="rp-side">
                    {header?.image && showPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={header.image} alt="" referrerPolicy="no-referrer" className="rp-photo" />
                    )}
                    {header && contactItems(header).length > 0 && (
                        <section>
                            <h2 className="rp-side-title">{t('contact')}</h2>
                            <ul className="rp-contact">
                                {contactItems(header).map(c => (
                                    <li key={c.href}>{c.label}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {filtered.skills.length > 0 && (
                        <section>
                            <h2 className="rp-side-title">{t('skills')}</h2>
                            {groupSkills(filtered.skills).map(group => (
                                <div key={group.key} className="rp-skill-group">
                                    <h3>{t(`skillCat_${group.key}`)}</h3>
                                    <p>{group.skills.map(s => s.name).join(' · ')}</p>
                                </div>
                            ))}
                        </section>
                    )}
                </aside>
                <div className="rp-main">
                    {header && <h1 className="rp-name">{header.name}</h1>}
                    {data.experiences.find(e => e.type === 'JOB')?.role && (
                        <p className="rp-role">{data.experiences.find(e => e.type === 'JOB')!.role}</p>
                    )}
                    {summary && <p className="rp-summary">{summary}</p>}

                    {SECTION_TYPES.map(type => {
                        const list = grouped[type];
                        if (list.length === 0) return null;
                        return (
                            <section key={type}>
                                <h2 className="rp-section-title">{t(SECTION_KEY[type])}</h2>
                                {list.map(exp => (
                                    <div key={exp.id} className="rp-exp">
                                        <div className="rp-exp-head">
                                            <span className="rp-exp-org">
                                                {exp.organization}
                                                {exp.role && <span className="rp-exp-role"> — {exp.role}</span>}
                                            </span>
                                            <span className="rp-exp-dates">{formatExperienceRange(exp.startDate, exp.endDate, locale, presentLabel)}</span>
                                        </div>
                                        {exp.description && <p className="rp-exp-desc">{exp.description}</p>}
                                        {exp.entries.length > 0 && (
                                            <ul>
                                                {exp.entries.map(e => (
                                                    <li key={e.id}>
                                                        {e.actionVerb && <strong>{e.actionVerb} </strong>}
                                                        {e.title}
                                                        {e.impact && <span className="rp-impact"> — {e.impact}</span>}
                                                        {e.techStack.length > 0 && <span className="rp-stack"> ({e.techStack.join(', ')})</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </section>
                        );
                    })}
                    {(grouped.BREAK.length > 0 || filtered.unlinked.length > 0) && (
                        <section>
                            <h2 className="rp-section-title">{t('sectionOther')}</h2>
                            {grouped.BREAK.map(exp => (
                                <div key={exp.id} className="rp-exp">
                                    <div className="rp-exp-head">
                                        <span className="rp-exp-org">{exp.organization}</span>
                                        <span className="rp-exp-dates">{formatExperienceRange(exp.startDate, exp.endDate, locale, presentLabel)}</span>
                                    </div>
                                    {exp.entries.length > 0 && (
                                        <ul>
                                            {exp.entries.map(e => (
                                                <li key={e.id}>
                                                    {e.actionVerb && <strong>{e.actionVerb} </strong>}
                                                    {e.title}
                                                    {e.impact && <span className="rp-impact"> — {e.impact}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {filtered.unlinked.length > 0 && (
                                <ul>
                                    {filtered.unlinked.map(e => (
                                        <li key={e.id}>
                                            {e.actionVerb && <strong>{e.actionVerb} </strong>}
                                            {e.title}
                                            {e.impact && <span className="rp-impact"> — {e.impact}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
