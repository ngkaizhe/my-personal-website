'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useModalFocusTrap } from '@/components/ui/useModalFocusTrap';
import type { ExperienceType } from '@/lib/types';
import { createExperienceInline, InlineExperienceOption } from '@/app/dashboard/experiences/actions';
import { inputClass, labelClass } from '@/lib/formStyles';

const TYPE_OPTIONS: ExperienceType[] = ['JOB', 'EDUCATION', 'PROJECT', 'VOLUNTEER', 'BREAK'];


interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (option: InlineExperienceOption) => void;
}

export default function NewExperienceModal({ open, onClose, onCreated }: Props) {
    const [type, setType] = useState<ExperienceType>('JOB');
    const [organization, setOrganization] = useState('');
    const [role, setRole] = useState('');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
    const [endDate, setEndDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations('NewExperienceModal');
    const tForm = useTranslations('ExperienceForm');
    const tType = useTranslations('ExperienceType');
    const tCommon = useTranslations('Common');

    const dialogRef = useRef<HTMLDivElement>(null);
    const firstFieldRef = useRef<HTMLSelectElement>(null);

    useModalFocusTrap({
        open,
        onClose,
        dialogRef,
        initialFocusRef: firstFieldRef,
    });

    // Reset state every time the modal re-opens so the next entry doesn't see
    // leftover values from a previous attempt. Done as a render-time
    // adjustment (React's "storing information from previous renders"
    // pattern) instead of an effect: React restarts the render immediately,
    // before committing, so the stale values never reach the DOM.
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setType('JOB');
            setOrganization('');
            setRole('');
            setStartDate(new Date().toISOString().substring(0, 10));
            setEndDate('');
            setError(null);
            setSubmitting(false);
        }
    }

    if (!open) return null;

    const roleRequired = type === 'JOB' || type === 'EDUCATION';
    const orgLabel = tType(`orgLabel_${type}`);
    const orgPlaceholder = tType(`orgPlaceholder_${type}`);
    const rolePlaceholder = tType(`rolePlaceholder_${type}`);
    const roleHint = roleRequired ? '' : tCommon('optional');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        try {
            const option = await createExperienceInline(formData);
            onCreated(option);
        } catch (err) {
            console.error('Failed to create experience inline:', err);
            setError(err instanceof Error ? err.message : t('errorGeneric'));
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 modal-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-experience-title"
        >
            <div
                className="absolute inset-0 bg-overlay backdrop-blur-sm"
                onClick={() => !submitting && onClose()}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                className="relative bg-surface rounded-xl shadow-2xl max-w-lg w-full p-6 z-10 modal-pop-in max-h-[90vh] overflow-y-auto"
            >
                <button
                    type="button"
                    onClick={() => !submitting && onClose()}
                    disabled={submitting}
                    className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    aria-label={tCommon('close')}
                >
                    <X size={20} />
                </button>
                <h2 id="new-experience-title" className="text-xl font-bold text-text-primary mb-4">
                    {t('title')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-exp-type" className={labelClass}>{tForm('type')}</label>
                        <select
                            id="new-exp-type"
                            ref={firstFieldRef}
                            name="type"
                            value={type}
                            onChange={e => setType(e.target.value as ExperienceType)}
                            className={inputClass}
                        >
                            {TYPE_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{tType(opt)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="new-exp-org" className={labelClass}>{orgLabel}</label>
                        <input
                            id="new-exp-org"
                            name="organization"
                            value={organization}
                            onChange={e => setOrganization(e.target.value)}
                            required
                            className={inputClass}
                            placeholder={orgPlaceholder}
                        />
                    </div>
                    <div>
                        <label htmlFor="new-exp-role" className={labelClass}>
                            {tType('role')} {roleHint && <span className="text-text-faint">{roleHint}</span>}
                        </label>
                        <input
                            id="new-exp-role"
                            name="role"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            required={roleRequired}
                            className={inputClass}
                            placeholder={rolePlaceholder}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="new-exp-start" className={labelClass}>{tForm('startDate')}</label>
                            <input id="new-exp-start" type="date" name="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="new-exp-end" className={labelClass}>{tForm('endDate')} <span className="text-text-faint">{tForm('endDateHint')}</span></label>
                            <input id="new-exp-end" type="date" name="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    <input type="hidden" name="color" value="blue" />

                    {error && (
                        <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {tCommon('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {submitting ? t('creating') : t('createButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
