'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import EntryFormPreview from '@/components/Entry/EntryFormPreview';
import TagInput from '@/components/ui/TagInput';
import { EmployerOption } from '@/components/Entry/EntryForm';

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
    employers: EmployerOption[];
    action: (formData: FormData) => Promise<void>;
}

export default function QuickAdd({ employers, action }: Props) {
    const [input, setInput] = useState('');
    const [parsing, setParsing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState<ParsedFields | null>(null);
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [employerId, setEmployerId] = useState('');

    const selectedEmployer = employers.find(e => e.id === employerId);

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
                throw new Error(err.error || 'Parse failed');
            }
            const data = await res.json();
            setParsed(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse');
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
        parsed.techStack.forEach(t => formData.append('techStack', t));
        try {
            await action(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
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
                <label htmlFor="quick-input" className={labelClass}>What did you do?</label>
                <textarea
                    id="quick-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    className={inputClass}
                    placeholder="e.g. Today I migrated the checkout flow from Redux to Zustand, which cut the bundle by 40KB and improved interaction latency"
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
                        {parsing ? 'Parsing...' : 'Parse with AI'}
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
                            Review & edit
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qa-date" className={labelClass}>Date</label>
                                <input id="qa-date" type="date" name="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="qa-employer" className={labelClass}>Employer</label>
                                <select id="qa-employer" name="employerId" value={employerId} onChange={e => setEmployerId(e.target.value)} className={inputClass}>
                                    <option value="">— None —</option>
                                    {employers.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                            <div>
                                <label htmlFor="qa-verb" className={labelClass}>Action verb</label>
                                <input id="qa-verb" name="actionVerb" value={parsed.actionVerb} onChange={e => updateParsed('actionVerb', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="qa-title" className={labelClass}>Title</label>
                                <input id="qa-title" name="title" value={parsed.title} onChange={e => updateParsed('title', e.target.value)} required className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="qa-desc" className={labelClass}>Description</label>
                            <textarea id="qa-desc" name="description" value={parsed.description} onChange={e => updateParsed('description', e.target.value)} rows={2} required className={inputClass} />
                        </div>

                        <div>
                            <label htmlFor="qa-impact" className={labelClass}>Impact <span className="text-text-faint">(Quantified outcome)</span></label>
                            <input id="qa-impact" name="impact" value={parsed.impact} onChange={e => updateParsed('impact', e.target.value)} className={inputClass} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qa-tag" className={labelClass}>Tag</label>
                                <input id="qa-tag" name="tag" value={parsed.tag} onChange={e => updateParsed('tag', e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="qa-icon" className={labelClass}>Icon</label>
                                <input id="qa-icon" name="iconName" value={parsed.iconName} onChange={e => updateParsed('iconName', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="qa-tech" className={labelClass}>Tech stack</label>
                            <TagInput
                                id="qa-tech"
                                values={parsed.techStack}
                                onChange={(techStack) => updateParsed('techStack', techStack)}
                                className={inputClass}
                            />
                        </div>

                        <input type="hidden" name="color" value={parsed.color} />
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
                                Start over
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20"
                            >
                                {submitting ? 'Saving...' : 'Save Entry'}
                            </button>
                        </div>
                    </div>

                    <div className="sticky top-24">
                        <p className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">Preview</p>
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
                                employerId,
                            }}
                            employerName={selectedEmployer?.name}
                            employerRole={selectedEmployer?.role}
                        />
                    </div>
                </form>
            )}
        </div>
    );
}
