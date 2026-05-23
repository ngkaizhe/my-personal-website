'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ExperienceType } from '@/lib/types';
import { createExperienceInline, InlineExperienceOption } from '@/app/dashboard/experiences/actions';

const TYPE_CONFIG: Record<ExperienceType, {
    label: string;
    organizationLabel: string;
    organizationPlaceholder: string;
    rolePlaceholder: string;
    roleHint: string;
}> = {
    JOB: { label: 'Job', organizationLabel: 'Company', organizationPlaceholder: 'TechStartup Co.', rolePlaceholder: 'Senior Frontend Engineer', roleHint: '' },
    EDUCATION: { label: 'Education', organizationLabel: 'School', organizationPlaceholder: 'State University', rolePlaceholder: 'BSc Computer Science', roleHint: '' },
    PROJECT: { label: 'Side project', organizationLabel: 'Project name', organizationPlaceholder: 'PeerLink', rolePlaceholder: 'Creator / Solo dev', roleHint: '(Optional)' },
    VOLUNTEER: { label: 'Volunteer / Community', organizationLabel: 'Organization', organizationPlaceholder: 'Open source — Node.js', rolePlaceholder: 'Maintainer', roleHint: '(Optional)' },
    BREAK: { label: 'Break / Sabbatical', organizationLabel: 'Label', organizationPlaceholder: 'Travel year', rolePlaceholder: '', roleHint: '(Optional)' },
};

const TYPE_OPTIONS: { value: ExperienceType; label: string }[] = [
    { value: 'JOB', label: TYPE_CONFIG.JOB.label },
    { value: 'EDUCATION', label: TYPE_CONFIG.EDUCATION.label },
    { value: 'PROJECT', label: TYPE_CONFIG.PROJECT.label },
    { value: 'VOLUNTEER', label: TYPE_CONFIG.VOLUNTEER.label },
    { value: 'BREAK', label: TYPE_CONFIG.BREAK.label },
];

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

    const dialogRef = useRef<HTMLDivElement>(null);
    const firstFieldRef = useRef<HTMLSelectElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        triggerRef.current = document.activeElement as HTMLElement | null;
        firstFieldRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            triggerRef.current?.focus?.();
        };
    }, [open, onClose]);

    // Reset state every time the modal re-opens so the next entry doesn't see
    // leftover values from a previous attempt.
    useEffect(() => {
        if (open) {
            setType('JOB');
            setOrganization('');
            setRole('');
            setStartDate(new Date().toISOString().substring(0, 10));
            setEndDate('');
            setError(null);
            setSubmitting(false);
        }
    }, [open]);

    if (!open) return null;

    const cfg = TYPE_CONFIG[type];
    const roleRequired = type === 'JOB' || type === 'EDUCATION';

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
            setError(err instanceof Error ? err.message : 'Failed to create experience.');
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
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                <h2 id="new-experience-title" className="text-xl font-bold text-text-primary mb-4">
                    New Experience
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-exp-type" className={labelClass}>Type</label>
                        <select
                            id="new-exp-type"
                            ref={firstFieldRef}
                            name="type"
                            value={type}
                            onChange={e => setType(e.target.value as ExperienceType)}
                            className={inputClass}
                        >
                            {TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="new-exp-org" className={labelClass}>{cfg.organizationLabel}</label>
                        <input
                            id="new-exp-org"
                            name="organization"
                            value={organization}
                            onChange={e => setOrganization(e.target.value)}
                            required
                            className={inputClass}
                            placeholder={cfg.organizationPlaceholder}
                        />
                    </div>
                    <div>
                        <label htmlFor="new-exp-role" className={labelClass}>
                            Role {cfg.roleHint && <span className="text-text-faint">{cfg.roleHint}</span>}
                        </label>
                        <input
                            id="new-exp-role"
                            name="role"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            required={roleRequired}
                            className={inputClass}
                            placeholder={cfg.rolePlaceholder}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="new-exp-start" className={labelClass}>Start Date</label>
                            <input id="new-exp-start" type="date" name="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="new-exp-end" className={labelClass}>End Date <span className="text-text-faint">(Leave blank if current)</span></label>
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {submitting ? 'Creating…' : 'Create Experience'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
