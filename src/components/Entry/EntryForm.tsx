'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { EntryDetail } from '@/app/dashboard/entries/actions';
import ColorPicker from '@/components/ui/ColorPicker';
import TagInput from '@/components/ui/TagInput';
import IconPicker from '@/components/ui/IconPicker';
import EntryFormPreview, { PreviewData } from '@/components/Entry/EntryFormPreview';

export interface EmployerOption {
    id: string;
    name: string;
    role: string;
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
    const reduceMotion = useReducedMotion();
    return (
        <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : delay }}
            className="space-y-5"
        >
            <h3 className="text-lg font-semibold text-form-section-text border-b border-form-section-border pb-2">{title}</h3>
            {children}
        </motion.section>
    );
}

interface Props {
    item: EntryDetail;
    employers: EmployerOption[];
    action: (formData: FormData) => Promise<void>;
}

export default function EntryForm({ item, employers, action }: Props) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewData>({
        date: item.date,
        title: item.title,
        actionVerb: item.actionVerb,
        description: item.description,
        impact: item.impact,
        details: item.details,
        tag: item.tag,
        color: item.color,
        iconName: item.iconName,
        techStack: item.techStack,
        linkUrl: item.linkUrl,
        linkText: item.linkText,
        employerId: item.employerId,
    });

    const updateField = <K extends keyof PreviewData>(field: K, value: PreviewData[K]) => {
        setPreview(prev => ({ ...prev, [field]: value }));
    };

    const selectedEmployer = employers.find(e => e.id === preview.employerId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        preview.techStack.forEach(t => formData.append('techStack', t));

        try {
            await action(formData);
        } catch (err) {
            console.error('Failed to save entry:', err);
            setError(err instanceof Error ? err.message : 'Failed to save entry. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
            <form
                onSubmit={handleSubmit}
                className="space-y-8 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
            >
                {/* Basic Info */}
                <Section title="Basic Info" delay={0}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="field-date" className={labelClass}>Date</label>
                            <input id="field-date" type="date" name="date" value={preview.date} onChange={e => updateField('date', e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="field-employer" className={labelClass}>Employer <span className="text-text-faint">(Optional)</span></label>
                            <select id="field-employer" name="employerId" value={preview.employerId} onChange={e => updateField('employerId', e.target.value)} className={inputClass}>
                                <option value="">— None (personal / outside work) —</option>
                                {employers.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="field-action-verb" className={labelClass}>Action Verb <span className="text-text-faint">(e.g. Led, Shipped, Reduced)</span></label>
                            <input id="field-action-verb" name="actionVerb" value={preview.actionVerb} onChange={e => updateField('actionVerb', e.target.value)} className={inputClass} placeholder="Shipped" />
                        </div>
                        <div>
                            <label htmlFor="field-title" className={labelClass}>Title</label>
                            <input id="field-title" name="title" value={preview.title} onChange={e => updateField('title', e.target.value)} required className={inputClass} placeholder="Migrated checkout to Zustand" />
                        </div>
                        <div>
                            <label htmlFor="field-tag" className={labelClass}>Tag</label>
                            <input id="field-tag" name="tag" value={preview.tag} onChange={e => updateField('tag', e.target.value)} required className={inputClass} placeholder="Engineering" />
                        </div>
                        <div>
                            <label htmlFor="field-icon" className={labelClass}>Icon</label>
                            <IconPicker id="field-icon" name="iconName" value={preview.iconName} onChange={v => updateField('iconName', v)} className={inputClass} />
                        </div>
                    </div>
                    <ColorPicker name="color" label="Color" value={preview.color} onChange={c => updateField('color', c)} />
                </Section>

                {/* Content */}
                <Section title="Content" delay={0.1}>
                    <div>
                        <label htmlFor="field-description" className={labelClass}>Short Description</label>
                        <textarea id="field-description" name="description" value={preview.description} onChange={e => updateField('description', e.target.value)} required rows={2} className={inputClass} placeholder="What did you do?" />
                    </div>
                    <div>
                        <label htmlFor="field-impact" className={labelClass}>
                            Impact <span className="text-text-faint">(Quantified outcome)</span>
                        </label>
                        <input id="field-impact" name="impact" value={preview.impact} onChange={e => updateField('impact', e.target.value)} className={inputClass} placeholder="Reduced bundle size by 40KB" />
                    </div>
                    <div>
                        <label htmlFor="field-details" className={labelClass}>Details <span className="text-text-faint">(Optional)</span></label>
                        <textarea id="field-details" name="details" value={preview.details} onChange={e => updateField('details', e.target.value)} rows={4} className={inputClass} placeholder="Context, approach, learnings..." />
                    </div>
                    <div>
                        <label htmlFor="field-techstack" className={labelClass}>Tech Stack / Skills <span className="text-text-faint">(Press Enter to add)</span></label>
                        <TagInput
                            id="field-techstack"
                            values={preview.techStack}
                            onChange={techStack => setPreview(prev => ({ ...prev, techStack }))}
                            placeholder="Type a technology and press Enter..."
                            className={inputClass}
                        />
                    </div>
                </Section>

                {/* Links */}
                <Section title="Links" delay={0.2}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="field-linkurl" className={labelClass}>URL <span className="text-text-faint">(Optional)</span></label>
                            <input id="field-linkurl" type="url" name="linkUrl" value={preview.linkUrl} onChange={e => updateField('linkUrl', e.target.value)} className={inputClass} placeholder="https://example.com" />
                        </div>
                        <div>
                            <label htmlFor="field-linktext" className={labelClass}>Link Text <span className="text-text-faint">(Optional)</span></label>
                            <input id="field-linktext" name="linkText" value={preview.linkText} onChange={e => updateField('linkText', e.target.value)} className={inputClass} placeholder="View PR" />
                        </div>
                    </div>
                </Section>

                {error && (
                    <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-end gap-3 pt-6 border-t border-form-action-border"
                >
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
                        {submitting ? 'Saving...' : 'Save Entry'}
                    </button>
                </motion.div>
            </form>

            {/* Live Preview */}
            <div className="sticky top-24">
                <p className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">Preview</p>
                <EntryFormPreview data={preview} employerName={selectedEmployer?.name} employerRole={selectedEmployer?.role} />
            </div>
        </div>
    );
}
