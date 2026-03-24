'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { JourneyDetail } from '@/app/dashboard/journeys/actions';
import ColorPicker from '@/components/ColorPicker';
import JourneyFormPreview, { PreviewData } from '@/components/JourneyFormPreview';

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-zinc-800/50 border border-zinc-700
    text-zinc-100 placeholder-zinc-500
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-zinc-600
`;

const labelClass = 'block text-sm font-medium text-zinc-400 mb-2';

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="space-y-5"
        >
            <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-700/50 pb-2">{title}</h3>
            {children}
        </motion.div>
    );
}

export default function JourneyForm({ item, action }: { item: JourneyDetail; action: (formData: FormData) => Promise<void> }) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [techStack, setTechStack] = useState<string[]>(item.techStack);
    const [color, setColor] = useState(item.color);
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

    const syncPreview = useCallback(() => {
        if (!formRef.current) return;
        const fd = new FormData(formRef.current);
        setPreview({
            year: (fd.get('year') as string) || '',
            title: (fd.get('title') as string) || '',
            tag: (fd.get('tag') as string) || '',
            color: (fd.get('color') as string) || 'blue',
            iconName: (fd.get('iconName') as string) || 'help-circle',
            description: (fd.get('description') as string) || '',
            details: (fd.get('details') as string) || '',
            techStack,
            linkUrl: (fd.get('linkUrl') as string) || '',
            linkText: (fd.get('linkText') as string) || '',
        });
    }, [techStack]);

    const handleColorChange = (c: string) => {
        setColor(c);
        // color is a hidden input, so we need to update preview manually after state settles
        setTimeout(() => syncPreview(), 0);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        techStack.forEach(t => formData.append('techStack', t));

        try {
            await action(formData);
        } catch (error) {
            console.error('Failed to save journey:', error);
            setSubmitting(false);
        }
    };

    const addTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !techStack.includes(val)) {
                const next = [...techStack, val];
                setTechStack(next);
                e.currentTarget.value = '';
                // Update preview with new tech stack
                if (!formRef.current) return;
                const fd = new FormData(formRef.current);
                setPreview(prev => ({
                    ...prev,
                    year: (fd.get('year') as string) || '',
                    title: (fd.get('title') as string) || '',
                    tag: (fd.get('tag') as string) || '',
                    color: (fd.get('color') as string) || 'blue',
                    iconName: (fd.get('iconName') as string) || 'help-circle',
                    description: (fd.get('description') as string) || '',
                    details: (fd.get('details') as string) || '',
                    techStack: next,
                    linkUrl: (fd.get('linkUrl') as string) || '',
                    linkText: (fd.get('linkText') as string) || '',
                }));
            }
        }
    };

    const removeTech = (t: string) => {
        const next = techStack.filter(v => v !== t);
        setTechStack(next);
        setPreview(prev => ({ ...prev, techStack: next }));
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
            {/* Form */}
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                onChange={syncPreview}
                className="space-y-8 bg-zinc-900/80 backdrop-blur-sm p-8 rounded-2xl border border-zinc-800 shadow-2xl shadow-black/20"
            >
                {/* Basic Info */}
                <Section title="Basic Info" delay={0}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Year</label>
                            <input name="year" defaultValue={item.year} required className={inputClass} placeholder="2024" />
                        </div>
                        <div>
                            <label className={labelClass}>Title</label>
                            <input name="title" defaultValue={item.title} required className={inputClass} placeholder="Senior Developer" />
                        </div>
                        <div>
                            <label className={labelClass}>Tag</label>
                            <input name="tag" defaultValue={item.tag} required className={inputClass} placeholder="Work" />
                        </div>
                        <div>
                            <label className={labelClass}>Icon Name</label>
                            <input name="iconName" defaultValue={item.iconName} required className={inputClass} placeholder="briefcase" />
                            <p className="text-xs text-zinc-500 mt-1.5">
                                Browse icons at{' '}
                                <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                                    lucide.dev
                                </a>
                            </p>
                        </div>
                    </div>
                    <ColorPicker name="color" label="Color" value={color} onChange={handleColorChange} />
                </Section>

                {/* Content */}
                <Section title="Content" delay={0.1}>
                    <div>
                        <label className={labelClass}>Short Description</label>
                        <textarea name="description" defaultValue={item.description} required rows={2} className={inputClass} placeholder="Brief summary of the milestone..." />
                    </div>
                    <div>
                        <label className={labelClass}>Details <span className="text-zinc-600">(Optional)</span></label>
                        <textarea name="details" defaultValue={item.details} rows={4} className={inputClass} placeholder="Detailed explanation..." />
                    </div>
                    <div>
                        <label className={labelClass}>Tech Stack <span className="text-zinc-600">(Press Enter to add)</span></label>
                        {techStack.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {techStack.map(t => (
                                    <motion.span
                                        key={t}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm flex items-center gap-1.5"
                                    >
                                        {t}
                                        <button
                                            type="button"
                                            onClick={() => removeTech(t)}
                                            className="text-blue-400/60 hover:text-red-400 transition-colors cursor-pointer"
                                        >
                                            &times;
                                        </button>
                                    </motion.span>
                                ))}
                            </div>
                        )}
                        <input type="text" onKeyDown={addTech} className={inputClass} placeholder="Type a technology and press Enter..." />
                    </div>
                </Section>

                {/* Links */}
                <Section title="Links" delay={0.2}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>URL <span className="text-zinc-600">(Optional)</span></label>
                            <input type="url" name="linkUrl" defaultValue={item.linkUrl} className={inputClass} placeholder="https://example.com" />
                        </div>
                        <div>
                            <label className={labelClass}>Link Text <span className="text-zinc-600">(Optional)</span></label>
                            <input name="linkText" defaultValue={item.linkText} className={inputClass} placeholder="View Project" />
                        </div>
                    </div>
                </Section>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-end gap-3 pt-6 border-t border-zinc-800"
                >
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 font-medium transition-all duration-200 cursor-pointer"
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
                <p className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">Preview</p>
                <JourneyFormPreview data={preview} />
            </div>
        </div>
    );
}
