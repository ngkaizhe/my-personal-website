'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployerDetail } from '@/app/dashboard/employers/actions';
import ColorPicker from '@/components/ui/ColorPicker';

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
    item: EmployerDetail;
    action: (formData: FormData) => Promise<void>;
}

export default function EmployerForm({ item, action }: Props) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<EmployerDetail>(item);

    const update = <K extends keyof EmployerDetail>(k: K, v: EmployerDetail[K]) => {
        setState(prev => ({ ...prev, [k]: v }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const formData = new FormData(e.currentTarget);

        try {
            await action(formData);
        } catch (err) {
            console.error('Failed to save employer:', err);
            setError(err instanceof Error ? err.message : 'Failed to save employer.');
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
        >
            <div>
                <label htmlFor="employer-name" className={labelClass}>Name</label>
                <input id="employer-name" name="name" value={state.name} onChange={e => update('name', e.target.value)} required className={inputClass} placeholder="TechStartup Co." />
            </div>
            <div>
                <label htmlFor="employer-role" className={labelClass}>Role</label>
                <input id="employer-role" name="role" value={state.role} onChange={e => update('role', e.target.value)} required className={inputClass} placeholder="Senior Frontend Engineer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="employer-start" className={labelClass}>Start Date</label>
                    <input id="employer-start" type="date" name="startDate" value={state.startDate} onChange={e => update('startDate', e.target.value)} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="employer-end" className={labelClass}>End Date <span className="text-text-faint">(Leave blank if current)</span></label>
                    <input id="employer-end" type="date" name="endDate" value={state.endDate} onChange={e => update('endDate', e.target.value)} className={inputClass} />
                </div>
            </div>
            <div>
                <label htmlFor="employer-desc" className={labelClass}>Description <span className="text-text-faint">(Optional)</span></label>
                <textarea id="employer-desc" name="description" value={state.description} onChange={e => update('description', e.target.value)} rows={3} className={inputClass} placeholder="Short description of the company or project..." />
            </div>
            <ColorPicker name="color" label="Color" value={state.color} onChange={c => update('color', c)} />

            {error && (
                <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-form-action-border">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-all duration-200 cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                >
                    {submitting ? 'Saving...' : 'Save Employer'}
                </button>
            </div>
        </form>
    );
}
