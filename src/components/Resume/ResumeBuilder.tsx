'use client';

import { useState, useMemo, useRef } from 'react';
import { Copy, Check, Download, Printer, Star, ChevronRight, Braces } from 'lucide-react';
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
    /** Enables the per-bullet "Improve" AI coaching button. Caller decides
     *  based on (aiAvailable && viewer-owns-the-resume). */
    canImproveBullets?: boolean;
    /** Link to the machine-readable JSON Resume for this profile (shown as a
     *  button in the actions column when provided). */
    jsonResumeUrl?: string;
    /** Name + contact links rendered at the top of the preview (and the
     *  markdown/PDF) — the printed résumé must carry its own contact info. */
    header?: ResumeHeader;
    /** Professional summary paragraph rendered under the header. Caller
     *  resolves the locale (resumeSummaryEn / resumeSummaryZh). */
    summary?: string | null;
}

/** "https://github.com/x" -> "github.com/x" for compact display/print. */
function bareUrl(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function contactItems(header: ResumeHeader): { label: string; href: string }[] {
    return [
        header.contactEmail ? { label: header.contactEmail, href: `mailto:${header.contactEmail}` } : null,
        header.github ? { label: bareUrl(header.github), href: header.github } : null,
        header.linkedin ? { label: bareUrl(header.linkedin), href: header.linkedin } : null,
        header.website ? { label: bareUrl(header.website), href: header.website } : null,
    ].filter((i): i is { label: string; href: string } => i !== null);
}

export default function ResumeBuilder({ data, canImproveBullets = false, jsonResumeUrl, header, summary }: ResumeBuilderProps) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(
        new Set(['unlinked', ...data.experiences.map(e => e.id)])
    );
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [printTemplate, setPrintTemplate] = useState<'minimal' | 'classic' | 'compact'>('minimal');
    const [showPhoto, setShowPhoto] = useState(true);
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
            for (const group of groupSkills(filtered.skills)) {
                lines.push(`- **${t(`skillCat_${group.key}`)}**: ${group.skills.map(s => s.name).join(' · ')}`);
            }
            lines.push('');
        }

        return lines.join('\n').trim();
    }, [grouped, filtered.unlinked, filtered.skills, t, locale, presentLabel, header, summary]);

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
                    <div>
                        <label htmlFor="print-template" className="block text-xs font-medium text-form-label mb-1.5">
                            {t('printTemplate')}
                        </label>
                        <select
                            id="print-template"
                            value={printTemplate}
                            onChange={(e) => {
                                const v = e.target.value as 'minimal' | 'classic' | 'compact';
                                setPrintTemplate(v);
                                document.body.dataset.printTemplate = v;
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-input-text text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="minimal">{t('templateMinimal')}</option>
                            <option value="classic">{t('templateClassic')}</option>
                            <option value="compact">{t('templateCompact')}</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            document.body.dataset.printTemplate = printTemplate;
                            window.print();
                        }}
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
                        ref={markdownRef}
                        id="md"
                        readOnly
                        value={markdown}
                        rows={14}
                        onClick={(e) => e.currentTarget.select()}
                        className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-input-text font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                </details>
            </div>
        </div>
    );
}
