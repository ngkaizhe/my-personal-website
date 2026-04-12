'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { JourneyDetail } from '@/app/dashboard/journeys/actions';
import ColorPicker from '@/components/ui/ColorPicker';
import TagInput from '@/components/ui/TagInput';
import IconPicker from '@/components/ui/IconPicker';
import JourneyFormPreview, { PreviewData } from '@/components/Journey/JourneyFormPreview';

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

export default function JourneyForm({ item, action }: { item: JourneyDetail; action: (formData: FormData) => Promise<void> }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewData>({
        year: item.year,
        title: item.title,
        tag: item.tag,
        color: item.color,
        iconName: item.iconName,
        description: item.description,
        details: item.details,
        techStack: item.techStack,
        linkUrl: item.linkUrl,
        linkText: item.linkText,
    });

    const updateField = (field: keyof PreviewData, value: string) => {
        setPreview(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        preview.techStack.forEach(t => formData.append('techStack', t));

        try {
            await action(formData);
        } catch (err) {
            console.error('Failed to save journey:', err);
            setError(err instanceof Error ? err.message : 'Failed to save journey. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="space-y-8 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
            >
                {/* Basic Info */}
                <Section title="Basic Info" delay={0}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="field-year" className={labelClass}>Year</label>
                            <input id="field-year" name="year" value={preview.year} onChange={e => updateField('year', e.target.value)} required className={inputClass} placeholder="2024" />
                        </div>
                        <div>
                            <label htmlFor="field-title" className={labelClass}>Title</label>
                            <input id="field-title" name="title" value={preview.title} onChange={e => updateField('title', e.target.value)} required className={inputClass} placeholder="Senior Developer" />
                        </div>
                        <div>
                            <label htmlFor="field-tag" className={labelClass}>Tag</label>
                            <input id="field-tag" name="tag" value={preview.tag} onChange={e => updateField('tag', e.target.value)} required className={inputClass} placeholder="Work" />
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
                        <textarea id="field-description" name="description" value={preview.description} onChange={e => updateField('description', e.target.value)} required rows={2} className={inputClass} placeholder="Brief summary of the milestone..." />
                    </div>
                    <div>
                        <label htmlFor="field-details" className={labelClass}>Details <span className="text-text-faint">(Optional)</span></label>
                        <textarea id="field-details" name="details" value={preview.details} onChange={e => updateField('details', e.target.value)} rows={4} className={inputClass} placeholder="Detailed explanation..." />
                    </div>
                    <div>
                        <label htmlFor="field-techstack" className={labelClass}>Tech Stack <span className="text-text-faint">(Press Enter to add)</span></label>
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
                            <input id="field-linktext" name="linkText" value={preview.linkText} onChange={e => updateField('linkText', e.target.value)} className={inputClass} placeholder="View Project" />
                        </div>
                    </div>
                </Section>

                {error && (
                    <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
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
                        {submitting ? 'Saving...' : 'Save Journey'}
                    </button>
                </motion.div>
            </form>

            {/* Live Preview */}
            <div className="sticky top-24">
                <p className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">Preview</p>
                <JourneyFormPreview data={preview} />
            </div>
        </div>
    );
}
