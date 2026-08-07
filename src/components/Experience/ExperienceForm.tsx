'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, Languages, Loader2, RefreshCw } from 'lucide-react';
import { ExperienceDetail, ExperienceTranslationDraft } from '@/app/dashboard/experiences/actions';
import type { ExperienceType } from '@/lib/types';
import ColorPicker from '@/components/ui/ColorPicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LocaleTabs } from '@/components/ui/LocaleTabs';
import { useUnsavedChangesWarning } from '@/components/ui/useUnsavedChangesWarning';
import { inputClass, labelClass, LOCALE_LABEL } from '@/lib/formStyles';
import { SUPPORTED_LOCALES, type Locale as SupportedLocale } from '@/i18n/locales';

const TYPE_OPTIONS: ExperienceType[] = ['JOB', 'EDUCATION', 'PROJECT', 'VOLUNTEER', 'BREAK'];
const EXPERIENCES_LIST = '/dashboard/experiences';

function isBlankExpTranslation(t: ExperienceTranslationDraft): boolean {
    return !t.organization.trim();
}

interface Props {
    item: ExperienceDetail;
    action: (formData: FormData) => Promise<void>;
    aiAvailable: boolean;
}

export default function ExperienceForm({ item, action, aiAvailable }: Props) {
    const router = useRouter();
    const uiLocale = useLocale();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations('ExperienceForm');
    const tType = useTranslations('ExperienceType');
    const tEntryForm = useTranslations('EntryForm');
    const tCommon = useTranslations('Common');

    const initialShared = useMemo(() => ({
        type: item.type,
        primaryLocale: item.primaryLocale,
        startDate: item.startDate,
        endDate: item.endDate,
        color: item.color,
    }), [item]);
    const initialTranslations = useMemo(() => {
        const byLocale: Record<string, ExperienceTranslationDraft> = {};
        for (const tr of item.translations) byLocale[tr.locale] = tr;
        return byLocale as Record<SupportedLocale, ExperienceTranslationDraft>;
    }, [item]);

    const [shared, setShared] = useState(initialShared);
    const [translations, setTranslations] = useState(initialTranslations);
    const [activeLocale, setActiveLocale] = useState<SupportedLocale>(
        (SUPPORTED_LOCALES as readonly string[]).includes(uiLocale) ? (uiLocale as SupportedLocale) : 'en',
    );
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const [translatingTo, setTranslatingTo] = useState<SupportedLocale | null>(null);
    const [translateError, setTranslateError] = useState<string | null>(null);

    const translateInto = async (target: SupportedLocale) => {
        const sourceLocale: SupportedLocale = target === 'en' ? 'zh-TW' : 'en';
        const src = translations[sourceLocale];
        if (isBlankExpTranslation(src)) {
            setTranslateError(tEntryForm('translateSourceEmpty', { locale: LOCALE_LABEL[sourceLocale] }));
            return;
        }
        setTranslatingTo(target);
        setTranslateError(null);
        try {
            const res = await fetch('/api/translate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'experience',
                    source: {
                        organization: src.organization,
                        role: src.role,
                        description: src.description,
                    },
                    sourceLocale,
                    targetLocale: target,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || tEntryForm('translateFailed'));
            }
            const data = await res.json();
            setTranslations(prev => ({
                ...prev,
                [target]: {
                    ...prev[target],
                    organization: data.translation.organization || '',
                    role: data.translation.role || '',
                    description: data.translation.description || '',
                    sourceHash: data.sourceHash,
                    lastTranslatedAt: new Date().toISOString(),
                },
            }));
            setActiveLocale(target);
        } catch (err) {
            setTranslateError(err instanceof Error ? err.message : tEntryForm('translateFailed'));
        } finally {
            setTranslatingTo(null);
        }
    };

    const updateShared = <K extends keyof typeof initialShared>(field: K, value: (typeof initialShared)[K]) => {
        setShared(prev => ({ ...prev, [field]: value }));
    };

    const updateTranslation = (locale: SupportedLocale, field: keyof ExperienceTranslationDraft, value: string) => {
        setTranslations(prev => ({
            ...prev,
            [locale]: { ...prev[locale], [field]: value },
        }));
    };

    const isDirty = useMemo(
        () => !submitting && (
            JSON.stringify(shared) !== JSON.stringify(initialShared) ||
            JSON.stringify(translations) !== JSON.stringify(initialTranslations)
        ),
        [shared, translations, initialShared, initialTranslations, submitting],
    );

    useUnsavedChangesWarning(isDirty);

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

        try {
            await action(formData);
        } catch (err) {
            console.error('Failed to save experience:', err);
            setError(err instanceof Error ? err.message : t('errorGeneric'));
            setSubmitting(false);
        }
    };

    const roleRequired = shared.type === 'JOB' || shared.type === 'EDUCATION';
    const roleHint = roleRequired ? '' : tCommon('optional');

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
        >
            <div>
                <label htmlFor="experience-type" className={labelClass}>{t('type')}</label>
                <select
                    id="experience-type"
                    name="type"
                    value={shared.type}
                    onChange={e => updateShared('type', e.target.value as ExperienceType)}
                    className={inputClass}
                >
                    {TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{tType(opt)}</option>
                    ))}
                </select>
                <p className="text-xs text-text-faint mt-1">{t('typeHint')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="experience-start" className={labelClass}>{t('startDate')}</label>
                    <input id="experience-start" type="date" name="startDate" value={shared.startDate} onChange={e => updateShared('startDate', e.target.value)} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="experience-end" className={labelClass}>{t('endDate')} <span className="text-text-faint">{t('endDateHint')}</span></label>
                    <input id="experience-end" type="date" name="endDate" value={shared.endDate} onChange={e => updateShared('endDate', e.target.value)} className={inputClass} />
                </div>
            </div>

            <ColorPicker name="color" label={t('color')} value={shared.color} onChange={c => updateShared('color', c)} />

            {/* Locale tabs */}
            <div>
                <LocaleTabs
                    activeLocale={activeLocale}
                    onSelect={setActiveLocale}
                    idPrefix="exp-"
                    states={Object.fromEntries(SUPPORTED_LOCALES.map(loc => [loc, {
                        blank: isBlankExpTranslation(translations[loc]),
                        stale: Boolean(translations[loc].isStale),
                    }]))}
                    labels={{
                        tablist: tEntryForm('localeTabsLabel'),
                        missing: tEntryForm('localeMissing'),
                        stale: tEntryForm('localeStale'),
                    }}
                />

                {SUPPORTED_LOCALES.map(loc => (
                    <div
                        key={loc}
                        role="tabpanel"
                        id={`exp-tabpanel-${loc}`}
                        aria-labelledby={`exp-tab-${loc}`}
                        hidden={activeLocale !== loc}
                        className="space-y-5 pt-5"
                    >
                        <div>
                            <label htmlFor={`exp-organization-${loc}`} className={labelClass}>{tType(`orgLabel_${shared.type}`)}</label>
                            <input
                                id={`exp-organization-${loc}`}
                                name={`organization_${loc}`}
                                value={translations[loc].organization}
                                onChange={e => updateTranslation(loc, 'organization', e.target.value)}
                                className={inputClass}
                                placeholder={tType(`orgPlaceholder_${shared.type}`)}
                            />
                        </div>
                        <div>
                            <label htmlFor={`exp-role-${loc}`} className={labelClass}>
                                {tType('role')} {roleHint && <span className="text-text-faint">{roleHint}</span>}
                            </label>
                            <input
                                id={`exp-role-${loc}`}
                                name={`role_${loc}`}
                                value={translations[loc].role}
                                onChange={e => updateTranslation(loc, 'role', e.target.value)}
                                className={inputClass}
                                placeholder={tType(`rolePlaceholder_${shared.type}`)}
                            />
                        </div>
                        <div>
                            <label htmlFor={`exp-desc-${loc}`} className={labelClass}>{t('description')} <span className="text-text-faint">{tCommon('optional')}</span></label>
                            <textarea id={`exp-desc-${loc}`} name={`description_${loc}`} value={translations[loc].description} onChange={e => updateTranslation(loc, 'description', e.target.value)} rows={3} className={inputClass} placeholder={t('descriptionPlaceholder')} />
                        </div>
                        {isBlankExpTranslation(translations[loc]) && loc !== shared.primaryLocale && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {tEntryForm('localeBlankHint', { locale: LOCALE_LABEL[loc] })}
                            </p>
                        )}
                        {translations[loc].isStale && !isBlankExpTranslation(translations[loc]) && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5" />
                                {tEntryForm('staleHint')}
                            </p>
                        )}
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
                                    ? tEntryForm('translating')
                                    : tEntryForm('translateFrom', { locale: LOCALE_LABEL[loc === 'en' ? 'zh-TW' : 'en'] })
                                }
                            </button>
                        )}
                        {!aiAvailable && loc !== shared.primaryLocale && (
                            <p className="text-xs text-text-faint flex items-center gap-1.5">
                                <Languages className="w-3.5 h-3.5" />
                                {tEntryForm('translateUnavailable')}
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
            </div>

            <input type="hidden" name="primaryLocale" value={shared.primaryLocale} />

            {SUPPORTED_LOCALES.map(loc => (
                <div key={`exp-meta-${loc}`}>
                    <input type="hidden" name={`sourceHash_${loc}`} value={translations[loc].sourceHash ?? ''} />
                    <input type="hidden" name={`lastTranslatedAt_${loc}`} value={translations[loc].lastTranslatedAt ?? ''} />
                </div>
            ))}

            {error && (
                <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-form-action-border">
                <Link
                    href={EXPERIENCES_LIST}
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
                    {submitting ? tCommon('saving') : t('saveExperience')}
                </button>
            </div>

            <ConfirmDialog
                open={confirmingCancel}
                title={t('discardTitle')}
                description={t('discardDescription')}
                confirmLabel={tCommon('discard')}
                pendingLabel={tCommon('leaving')}
                danger
                onConfirm={() => router.push(EXPERIENCES_LIST)}
                onClose={() => setConfirmingCancel(false)}
            />
        </form>
    );
}
