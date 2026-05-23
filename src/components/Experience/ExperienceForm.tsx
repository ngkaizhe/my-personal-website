'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExperienceDetail } from '@/app/dashboard/experiences/actions';
import type { ExperienceType } from '@/lib/types';
import ColorPicker from '@/components/ui/ColorPicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const TYPE_OPTIONS: ExperienceType[] = ['JOB', 'EDUCATION', 'PROJECT', 'VOLUNTEER', 'BREAK'];

const EXPERIENCES_LIST = '/dashboard/experiences';

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

const labelClass = 'block text-sm font-medium text-form-label mb-2';

interface Props {
    item: ExperienceDetail;
    action: (formData: FormData) => Promise<void>;
}

export default function ExperienceForm({ item, action }: Props) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<ExperienceDetail>(item);
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const t = useTranslations('ExperienceForm');
    const tType = useTranslations('ExperienceType');
    const tCommon = useTranslations('Common');

    const update = <K extends keyof ExperienceDetail>(k: K, v: ExperienceDetail[K]) => {
        setState(prev => ({ ...prev, [k]: v }));
    };

    const isDirty = useMemo(
        () => !submitting && JSON.stringify(state) !== JSON.stringify(item),
        [state, item, submitting]
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

        try {
            await action(formData);
        } catch (err) {
            console.error('Failed to save experience:', err);
            setError(err instanceof Error ? err.message : t('errorGeneric'));
            setSubmitting(false);
        }
    };

    const roleRequired = state.type === 'JOB' || state.type === 'EDUCATION';
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
                    value={state.type}
                    onChange={e => update('type', e.target.value as ExperienceType)}
                    className={inputClass}
                >
                    {TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{tType(opt)}</option>
                    ))}
                </select>
                <p className="text-xs text-text-faint mt-1">
                    {t('typeHint')}
                </p>
            </div>
            <div>
                <label htmlFor="experience-organization" className={labelClass}>{tType(`orgLabel_${state.type}`)}</label>
                <input
                    id="experience-organization"
                    name="organization"
                    value={state.organization}
                    onChange={e => update('organization', e.target.value)}
                    required
                    className={inputClass}
                    placeholder={tType(`orgPlaceholder_${state.type}`)}
                />
            </div>
            <div>
                <label htmlFor="experience-role" className={labelClass}>
                    {tType('role')} {roleHint && <span className="text-text-faint">{roleHint}</span>}
                </label>
                <input
                    id="experience-role"
                    name="role"
                    value={state.role}
                    onChange={e => update('role', e.target.value)}
                    required={roleRequired}
                    className={inputClass}
                    placeholder={tType(`rolePlaceholder_${state.type}`)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="experience-start" className={labelClass}>{t('startDate')}</label>
                    <input id="experience-start" type="date" name="startDate" value={state.startDate} onChange={e => update('startDate', e.target.value)} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="experience-end" className={labelClass}>{t('endDate')} <span className="text-text-faint">{t('endDateHint')}</span></label>
                    <input id="experience-end" type="date" name="endDate" value={state.endDate} onChange={e => update('endDate', e.target.value)} className={inputClass} />
                </div>
            </div>
            <div>
                <label htmlFor="experience-desc" className={labelClass}>{t('description')} <span className="text-text-faint">{tCommon('optional')}</span></label>
                <textarea id="experience-desc" name="description" value={state.description} onChange={e => update('description', e.target.value)} rows={3} className={inputClass} placeholder={t('descriptionPlaceholder')} />
            </div>
            <ColorPicker name="color" label={t('color')} value={state.color} onChange={c => update('color', c)} />

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
