'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import EntryFormPreview from '@/components/Entry/EntryFormPreview';
import TagInput from '@/components/ui/TagInput';
import IconPicker from '@/components/ui/IconPicker';
import ColorPicker from '@/components/ui/ColorPicker';
import NewExperienceModal from '@/components/Experience/NewExperienceModal';
import { ExperienceOption } from '@/components/Entry/EntryForm';

const NEW_EXPERIENCE_SENTINEL = '__new__';

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

const labelClass = 'block text-sm font-medium text-form-label mb-2';

interface ParsedFields {
    actionVerb: string;
    title: string;
    description: string;
    impact: string;
    tag: string;
    techStack: string[];
    color: string;
    iconName: string;
}

interface Props {
    experiences: ExperienceOption[];
    action: (formData: FormData) => Promise<void>;
}

export default function QuickAdd({ experiences, action }: Props) {
    const [input, setInput] = useState('');
    const [parsing, setParsing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState<ParsedFields | null>(null);
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [experienceId, setExperienceId] = useState('');
    const [experiencesState, setExperiencesState] = useState(experiences);
    const [creatingExperience, setCreatingExperience] = useState(false);
    const t = useTranslations('QuickAdd');
    const tForm = useTranslations('EntryForm');
    const tCommon = useTranslations('Common');

    const selectedExperience = experiencesState.find(e => e.id === experienceId);

    const handleExperienceChange = (value: string) => {
        if (value === NEW_EXPERIENCE_SENTINEL) {
            setCreatingExperience(true);
            return;
        }
        setExperienceId(value);
    };

    const parse = async () => {
        if (!input.trim()) return;
        setParsing(true);
        setError(null);
        try {
            const res = await fetch('/api/parse-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || t('parseFailed'));
            }
            const data = await res.json();
            setParsed(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('parseFailed'));
        } finally {
            setParsing(false);
        }
    };

    const save = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!parsed) return;
        setSubmitting(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        parsed.techStack.forEach(tech => formData.append('techStack', tech));
        try {
            await action(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('saveFailed'));
            setSubmitting(false);
        }
    };

    const updateParsed = <K extends keyof ParsedFields>(k: K, v: ParsedFields[K]) => {
        setParsed(prev => prev ? { ...prev, [k]: v } : prev);
    };

    return (
        <div className="space-y-6">
            {/* Input card */}
            <div className="bg-form-bg backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-form-border shadow-2xl">
                <label htmlFor="quick-input" className={labelClass}>{t('prompt')}</label>
                <textarea
                    id="quick-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    className={inputClass}
                    placeholder={t('placeholder')}
                    disabled={parsing || submitting}
                />
                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        onClick={parse}
                        disabled={!input.trim() || parsing || submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {parsing ? t('parsing') : t('parseWithAi')}
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Parsed preview + edit */}
            {parsed && (
                <form onSubmit={save} className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
                    <div className="space-y-5 bg-form-bg backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-form-border shadow-2xl">
                        <h2 className="text-lg font-semibold text-form-section-text border-b border-form-section-border pb-2">
                            {t('reviewAndEdit')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qa-date" className={labelClass}>{tForm('date')}</label>
                                <input id="qa-date" type="date" name="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="qa-experience" className={labelClass}>{tForm('experience')}</label>
                                <select id="qa-experience" name="experienceId" value={experienceId} onChange={e => handleExperienceChange(e.target.value)} className={inputClass}>
                                    <option value="">{tForm('experienceNone')}</option>
                                    {experiencesState.map(exp => (
                                        <option key={exp.id} value={exp.id}>{exp.name}</option>
                                    ))}
                                    <option value={NEW_EXPERIENCE_SENTINEL}>{tForm('createNewExperience')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                            <div>
                                <label htmlFor="qa-verb" className={labelClass}>{tForm('actionVerb')}</label>
                                <input id="qa-verb" name="actionVerb" value={parsed.actionVerb} onChange={e => updateParsed('actionVerb', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="qa-title" className={labelClass}>{tForm('title')}</label>
                                <input id="qa-title" name="title" value={parsed.title} onChange={e => updateParsed('title', e.target.value)} required className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="qa-desc" className={labelClass}>{tForm('description')}</label>
                            <textarea id="qa-desc" name="description" value={parsed.description} onChange={e => updateParsed('description', e.target.value)} rows={2} required className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="qa-impact" className={labelClass}>{tForm('impact')} <span className="text-text-faint">{tForm('impactHint')}</span></label>
                            <input id="qa-impact" name="impact" value={parsed.impact} onChange={e => updateParsed('impact', e.target.value)} className={inputClass} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qa-tag" className={labelClass}>{tForm('tag')}</label>
                                <input id="qa-tag" name="tag" value={parsed.tag} onChange={e => updateParsed('tag', e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="qa-icon" className={labelClass}>{tForm('icon')}</label>
                                <IconPicker
                                    id="qa-icon"
                                    name="iconName"
                                    value={parsed.iconName}
                                    onChange={v => updateParsed('iconName', v)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="qa-tech" className={labelClass}>{tForm('techStack')}</label>
                            <TagInput
                                id="qa-tech"
                                values={parsed.techStack}
                                onChange={(techStack) => updateParsed('techStack', techStack)}
                                className={inputClass}
                            />
                        </div>

                        <ColorPicker
                            name="color"
                            label={tForm('color')}
                            value={parsed.color}
                            onChange={c => updateParsed('color', c)}
                        />

                        <input type="hidden" name="details" value="" />
                        <input type="hidden" name="linkUrl" value="" />
                        <input type="hidden" name="linkText" value="" />

                        <div className="flex justify-end gap-3 pt-4 border-t border-form-action-border">
                            <button
                                type="button"
                                onClick={() => { setParsed(null); setInput(''); }}
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
                            >
                                {t('startOver')}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20"
                            >
                                {submitting ? tCommon('saving') : tForm('saveEntry')}
                            </button>
                        </div>
                    </div>

                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">{tForm('previewLabel')}</p>
                        <EntryFormPreview
                            data={{
                                date,
                                title: parsed.title,
                                actionVerb: parsed.actionVerb,
                                description: parsed.description,
                                impact: parsed.impact,
                                details: '',
                                tag: parsed.tag,
                                color: parsed.color,
                                iconName: parsed.iconName,
                                techStack: parsed.techStack,
                                linkUrl: '',
                                linkText: '',
                                experienceId,
                            }}
                            experienceName={selectedExperience?.name}
                            experienceRole={selectedExperience?.role ?? undefined}
                        />
                    </div>
                </form>
            )}

            <NewExperienceModal
                open={creatingExperience}
                onClose={() => setCreatingExperience(false)}
                onCreated={(option) => {
                    setExperiencesState(prev => [option, ...prev]);
                    setExperienceId(option.id);
                    setCreatingExperience(false);
                }}
            />
        </div>
    );
}
