'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Languages, Loader2, RefreshCw } from 'lucide-react';
import { EntryDetail, EntryTranslationDraft } from '@/app/dashboard/entries/actions';
import ColorPicker from '@/components/ui/ColorPicker';
import TagInput from '@/components/ui/TagInput';
import IconPicker from '@/components/ui/IconPicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import EntryFormPreview, { PreviewData } from '@/components/Entry/EntryFormPreview';
import NewExperienceModal from '@/components/Experience/NewExperienceModal';

const ENTRIES_LIST = '/dashboard/entries';
const NEW_EXPERIENCE_SENTINEL = '__new__';
const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const LOCALE_LABEL: Record<SupportedLocale, string> = { en: 'English', 'zh-TW': '中文' };

import type { ExperienceType } from '@/lib/types';

export interface ExperienceOption {
    id: string;
    type: ExperienceType;
    name: string;
    role: string | null;
}

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

const labelClass = 'block text-sm font-medium text-form-label mb-2';

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
    return (
        <section
            className="space-y-5 section-reveal"
            style={{ ['--reveal-delay' as string]: `${delay}s` }}
        >
            <h3 className="text-lg font-semibold text-form-section-text border-b border-form-section-border pb-2">{title}</h3>
            {children}
        </section>
    );
}

function isBlankTranslation(t: EntryTranslationDraft): boolean {
    return !t.title.trim() && !t.description.trim() && !t.tag.trim();
}

interface Props {
    item: EntryDetail;
    experiences: ExperienceOption[];
    action: (formData: FormData) => Promise<void>;
    aiAvailable: boolean;
}

export default function EntryForm({ item, experiences, action, aiAvailable }: Props) {
    const router = useRouter();
    const uiLocale = useLocale();
    const t = useTranslations('EntryForm');
    const tCommon = useTranslations('Common');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial: shared fields + per-locale translation drafts.
    const initialShared = useMemo(() => ({
        date: item.date,
        primaryLocale: item.primaryLocale,
        color: item.color,
        iconName: item.iconName,
        techStack: item.techStack,
        linkUrl: item.linkUrl,
        linkText: item.linkText,
        experienceId: item.experienceId,
    }), [item]);

    const initialTranslations = useMemo(() => {
        const byLocale: Record<string, EntryTranslationDraft> = {};
        for (const tr of item.translations) byLocale[tr.locale] = tr;
        return byLocale as Record<SupportedLocale, EntryTranslationDraft>;
    }, [item]);

    const [shared, setShared] = useState(initialShared);
    const [translations, setTranslations] = useState(initialTranslations);
    const [activeLocale, setActiveLocale] = useState<SupportedLocale>(
        (SUPPORTED_LOCALES as readonly string[]).includes(uiLocale) ? (uiLocale as SupportedLocale) : 'en',
    );

    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const [experiencesState, setExperiencesState] = useState(experiences);
    const [creatingExperience, setCreatingExperience] = useState(false);
    const [translatingTo, setTranslatingTo] = useState<SupportedLocale | null>(null);
    const [translateError, setTranslateError] = useState<string | null>(null);

    // Translate the *source* tab's content into the target locale. Source is
    // either the entry's primaryLocale (if it has content) or the only
    // populated tab — usually the same thing.
    const translateInto = async (target: SupportedLocale) => {
        const sourceLocale: SupportedLocale = target === 'en' ? 'zh-TW' : 'en';
        const src = translations[sourceLocale];
        if (isBlankTranslation(src)) {
            setTranslateError(t('translateSourceEmpty', { locale: LOCALE_LABEL[sourceLocale] }));
            return;
        }
        setTranslatingTo(target);
        setTranslateError(null);
        try {
            const res = await fetch('/api/translate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'entry',
                    source: {
                        title: src.title,
                        actionVerb: src.actionVerb,
                        description: src.description,
                        impact: src.impact,
                        details: src.details,
                        tag: src.tag,
                    },
                    sourceLocale,
                    targetLocale: target,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || t('translateFailed'));
            }
            const data = await res.json();
            setTranslations(prev => ({
                ...prev,
                [target]: {
                    ...prev[target],
                    title: data.translation.title || '',
                    actionVerb: data.translation.actionVerb || '',
                    description: data.translation.description || '',
                    impact: data.translation.impact || '',
                    details: data.translation.details || '',
                    tag: data.translation.tag || '',
                    sourceHash: data.sourceHash,
                    lastTranslatedAt: new Date().toISOString(),
                },
            }));
            setActiveLocale(target);
        } catch (err) {
            setTranslateError(err instanceof Error ? err.message : t('translateFailed'));
        } finally {
            setTranslatingTo(null);
        }
    };

    const updateShared = <K extends keyof typeof initialShared>(field: K, value: (typeof initialShared)[K]) => {
        setShared(prev => ({ ...prev, [field]: value }));
    };

    const updateTranslation = (locale: SupportedLocale, field: keyof EntryTranslationDraft, value: string) => {
        setTranslations(prev => ({
            ...prev,
            [locale]: { ...prev[locale], [field]: value },
        }));
    };

    const selectedExperience = experiencesState.find(e => e.id === shared.experienceId);

    const handleExperienceChange = (value: string) => {
        if (value === NEW_EXPERIENCE_SENTINEL) {
            setCreatingExperience(true);
            return;
        }
        updateShared('experienceId', value);
    };

    const isDirty = useMemo(
        () => !submitting && (
            JSON.stringify(shared) !== JSON.stringify(initialShared) ||
            JSON.stringify(translations) !== JSON.stringify(initialTranslations)
        ),
        [shared, translations, initialShared, initialTranslations, submitting],
    );

    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const handleCancelClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isDirty) {
            e.preventDefault();
            setConfirmingCancel(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        shared.techStack.forEach(tech => formData.append('techStack', tech));

        try {
            await action(formData);
        } catch (err) {
            console.error('Failed to save entry:', err);
            setError(err instanceof Error ? err.message : t('errorGeneric'));
            setSubmitting(false);
        }
    };

    const active = translations[activeLocale];
    const previewData: PreviewData = {
        date: shared.date,
        title: active.title,
        actionVerb: active.actionVerb,
        description: active.description,
        impact: active.impact,
        details: active.details,
        tag: active.tag,
        color: shared.color,
        iconName: shared.iconName,
        techStack: shared.techStack,
        linkUrl: shared.linkUrl,
        linkText: shared.linkText,
        experienceId: shared.experienceId,
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
            <form
                onSubmit={handleSubmit}
                className="space-y-8 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
            >
                {/* Shared / language-neutral fields */}
                <Section title={t('sectionBasic')} delay={0}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="field-date" className={labelClass}>{t('date')}</label>
                            <input id="field-date" type="date" name="date" value={shared.date} onChange={e => updateShared('date', e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="field-experience" className={labelClass}>{t('experience')} <span className="text-text-faint">{tCommon('optional')}</span></label>
                            <select id="field-experience" name="experienceId" value={shared.experienceId} onChange={e => handleExperienceChange(e.target.value)} className={inputClass}>
                                <option value="">{t('experienceNone')}</option>
                                {experiencesState.map(exp => (
                                    <option key={exp.id} value={exp.id}>
                                        {exp.role ? `${exp.name} — ${exp.role}` : exp.name}
                                    </option>
                                ))}
                                <option value={NEW_EXPERIENCE_SENTINEL}>{t('createNewExperience')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="field-icon" className={labelClass}>{t('icon')}</label>
                            <IconPicker id="field-icon" name="iconName" value={shared.iconName} onChange={v => updateShared('iconName', v)} className={inputClass} />
                        </div>
                    </div>
                    <ColorPicker name="color" label={t('color')} value={shared.color} onChange={c => updateShared('color', c)} />
                </Section>

                {/* Per-locale tabs */}
                <Section title={t('sectionContent')} delay={0.1}>
                    <div role="tablist" aria-label={t('localeTabsLabel')} className="flex gap-1 border-b border-form-section-border">
                        {SUPPORTED_LOCALES.map(loc => {
                            const blank = isBlankTranslation(translations[loc]);
                            const stale = translations[loc].isStale && !blank;
                            const active = activeLocale === loc;
                            return (
                                <button
                                    key={loc}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    aria-controls={`tabpanel-${loc}`}
                                    id={`tab-${loc}`}
                                    onClick={() => setActiveLocale(loc)}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg cursor-pointer transition-colors
                                        flex items-center gap-2
                                        ${active
                                            ? 'bg-surface-elevated text-text-primary border border-form-section-border border-b-transparent -mb-px'
                                            : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/50'
                                        }
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                                >
                                    {LOCALE_LABEL[loc]}
                                    {blank && <AlertCircle className="w-4 h-4 text-amber-500" aria-label={t('localeMissing')} />}
                                    {stale && <RefreshCw className="w-3.5 h-3.5 text-amber-500" aria-label={t('localeStale')} />}
                                    {!blank && !stale && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>

                    {SUPPORTED_LOCALES.map(loc => (
                        <div
                            key={loc}
                            role="tabpanel"
                            id={`tabpanel-${loc}`}
                            aria-labelledby={`tab-${loc}`}
                            hidden={activeLocale !== loc}
                            className="space-y-5 pt-2"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5">
                                <div>
                                    <label htmlFor={`field-actionVerb-${loc}`} className={labelClass}>{t('actionVerb')} <span className="text-text-faint">{t('actionVerbHint')}</span></label>
                                    <input id={`field-actionVerb-${loc}`} name={`actionVerb_${loc}`} value={translations[loc].actionVerb} onChange={e => updateTranslation(loc, 'actionVerb', e.target.value)} className={inputClass} placeholder={t('actionVerbPlaceholder')} />
                                </div>
                                <div>
                                    <label htmlFor={`field-title-${loc}`} className={labelClass}>{t('title')}</label>
                                    <input id={`field-title-${loc}`} name={`title_${loc}`} value={translations[loc].title} onChange={e => updateTranslation(loc, 'title', e.target.value)} className={inputClass} placeholder={t('titlePlaceholder')} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor={`field-tag-${loc}`} className={labelClass}>{t('tag')}</label>
                                <input id={`field-tag-${loc}`} name={`tag_${loc}`} value={translations[loc].tag} onChange={e => updateTranslation(loc, 'tag', e.target.value)} className={inputClass} placeholder={t('tagPlaceholder')} />
                            </div>
                            <div>
                                <label htmlFor={`field-description-${loc}`} className={labelClass}>{t('description')}</label>
                                <textarea id={`field-description-${loc}`} name={`description_${loc}`} value={translations[loc].description} onChange={e => updateTranslation(loc, 'description', e.target.value)} rows={2} className={inputClass} placeholder={t('descriptionPlaceholder')} />
                            </div>
                            <div>
                                <label htmlFor={`field-impact-${loc}`} className={labelClass}>
                                    {t('impact')} <span className="text-text-faint">{t('impactHint')}</span>
                                </label>
                                <input id={`field-impact-${loc}`} name={`impact_${loc}`} value={translations[loc].impact} onChange={e => updateTranslation(loc, 'impact', e.target.value)} className={inputClass} placeholder={t('impactPlaceholder')} />
                            </div>
                            <div>
                                <label htmlFor={`field-details-${loc}`} className={labelClass}>{t('details')} <span className="text-text-faint">{tCommon('optional')}</span></label>
                                <textarea id={`field-details-${loc}`} name={`details_${loc}`} value={translations[loc].details} onChange={e => updateTranslation(loc, 'details', e.target.value)} rows={4} className={inputClass} placeholder={t('detailsPlaceholder')} />
                            </div>
                            {isBlankTranslation(translations[loc]) && loc !== shared.primaryLocale && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {t('localeBlankHint', { locale: LOCALE_LABEL[loc] })}
                                </p>
                            )}
                            {translations[loc].isStale && !isBlankTranslation(translations[loc]) && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t('staleHint')}
                                </p>
                            )}

                            {/* Translate button — fills this tab from the other locale's content. */}
                            {aiAvailable && (
                                <button
                                    type="button"
                                    onClick={() => translateInto(loc)}
                                    disabled={translatingTo !== null}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-form-section-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    {translatingTo === loc
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Languages className="w-4 h-4" />
                                    }
                                    {translatingTo === loc
                                        ? t('translating')
                                        : t('translateFrom', { locale: LOCALE_LABEL[loc === 'en' ? 'zh-TW' : 'en'] })
                                    }
                                </button>
                            )}
                            {!aiAvailable && loc !== shared.primaryLocale && (
                                <p className="text-xs text-text-faint flex items-center gap-1.5">
                                    <Languages className="w-3.5 h-3.5" />
                                    {t('translateUnavailable')}
                                </p>
                            )}
                            {translateError && translatingTo === null && activeLocale === loc && (
                                <p role="alert" className="text-xs text-red-500 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {translateError}
                                </p>
                            )}
                        </div>
                    ))}

                    <div>
                        <label htmlFor="field-techstack" className={labelClass}>{t('techStack')} <span className="text-text-faint">{t('techStackHint')}</span></label>
                        <TagInput
                            id="field-techstack"
                            values={shared.techStack}
                            onChange={techStack => updateShared('techStack', techStack)}
                            placeholder={t('techStackPlaceholder')}
                            className={inputClass}
                        />
                    </div>
                </Section>

                {/* Links — shared */}
                <Section title={t('sectionLinks')} delay={0.2}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="field-linkurl" className={labelClass}>{t('url')} <span className="text-text-faint">{tCommon('optional')}</span></label>
                            <input id="field-linkurl" type="url" name="linkUrl" value={shared.linkUrl} onChange={e => updateShared('linkUrl', e.target.value)} className={inputClass} placeholder={t('urlPlaceholder')} />
                        </div>
                        <div>
                            <label htmlFor="field-linktext" className={labelClass}>{t('linkText')} <span className="text-text-faint">{tCommon('optional')}</span></label>
                            <input id="field-linktext" name="linkText" value={shared.linkText} onChange={e => updateShared('linkText', e.target.value)} className={inputClass} placeholder={t('linkTextPlaceholder')} />
                        </div>
                    </div>
                </Section>

                {/* Hidden — primaryLocale tracks which side was authored first */}
                <input type="hidden" name="primaryLocale" value={shared.primaryLocale} />

                {/* Hidden — translation metadata returned by the Translate API.
                    Persisted on save so stale-translation detection survives across edits. */}
                {SUPPORTED_LOCALES.map(loc => (
                    <div key={`meta-${loc}`}>
                        <input type="hidden" name={`sourceHash_${loc}`} value={translations[loc].sourceHash ?? ''} />
                        <input type="hidden" name={`lastTranslatedAt_${loc}`} value={translations[loc].lastTranslatedAt ?? ''} />
                    </div>
                ))}

                {error && (
                    <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div
                    className="flex justify-end gap-3 pt-6 border-t border-form-action-border section-reveal"
                    style={{ ['--reveal-delay' as string]: '0.3s' }}
                >
                    <Link
                        href={ENTRIES_LIST}
                        onClick={handleCancelClick}
                        aria-disabled={submitting}
                        className={`px-6 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-all duration-200 cursor-pointer ${
                            submitting ? 'pointer-events-none opacity-50' : ''
                        }`}
                    >
                        {tCommon('cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                    >
                        {submitting ? t('savingEntry') : t('saveEntry')}
                    </button>
                </div>
            </form>

            {/* Preview — reflects the active tab */}
            <div className="sticky top-24">
                <p className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">
                    {t('previewLabel')} · {LOCALE_LABEL[activeLocale]}
                </p>
                <EntryFormPreview data={previewData} experienceName={selectedExperience?.name} experienceRole={selectedExperience?.role ?? undefined} />
            </div>

            <ConfirmDialog
                open={confirmingCancel}
                title={t('discardTitle')}
                description={t('discardDescription')}
                confirmLabel={tCommon('discard')}
                pendingLabel={tCommon('leaving')}
                danger
                onConfirm={() => router.push(ENTRIES_LIST)}
                onClose={() => setConfirmingCancel(false)}
            />

            <NewExperienceModal
                open={creatingExperience}
                onClose={() => setCreatingExperience(false)}
                onCreated={(option) => {
                    setExperiencesState(prev => [option, ...prev]);
                    updateShared('experienceId', option.id);
                    setCreatingExperience(false);
                }}
            />
        </div>
    );
}
