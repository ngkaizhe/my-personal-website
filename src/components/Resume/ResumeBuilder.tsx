'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import type { ResumeData, ResumeEntry, ResumeEmployer } from '@/app/dashboard/resume/actions';

const inputClass = `
    w-full px-4 py-2.5 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
`;

function formatEmployerRange(start: string, end: string | null) {
    const s = new Date(start).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    const e = end ? new Date(end).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Present';
    return `${s} – ${e}`;
}

function bulletFromEntry(entry: ResumeEntry): string {
    const parts: string[] = [];
    const verb = entry.actionVerb?.trim();
    if (verb) parts.push(verb);
    parts.push(entry.title);
    let line = parts.join(' ');
    if (entry.impact) line += ` — ${entry.impact}`;
    if (entry.techStack.length > 0) line += ` *(${entry.techStack.join(', ')})*`;
    return `- ${line}`;
}

function inRange(iso: string, from: string, to: string) {
    const d = new Date(iso).getTime();
    if (from && d < new Date(from).getTime()) return false;
    if (to && d > new Date(to).getTime() + 86400000) return false;
    return true;
}

export default function ResumeBuilder({ data }: { data: ResumeData }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedEmployers, setSelectedEmployers] = useState<Set<string>>(
        new Set(['unlinked', ...data.employers.map(e => e.id)])
    );
    const [copied, setCopied] = useState(false);

    const toggleEmployer = (id: string) => {
        setSelectedEmployers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filtered = useMemo(() => {
        const employers: ResumeEmployer[] = data.employers
            .filter(emp => selectedEmployers.has(emp.id))
            .map(emp => ({
                ...emp,
                entries: emp.entries.filter(e => inRange(e.date, from, to)),
            }))
            .filter(emp => emp.entries.length > 0);

        const unlinked = selectedEmployers.has('unlinked')
            ? data.unlinkedEntries.filter(e => inRange(e.date, from, to))
            : [];

        const usedSkills = new Map<string, number>();
        const allEntries = [...employers.flatMap(e => e.entries), ...unlinked];
        for (const entry of allEntries) {
            for (const skill of entry.techStack) {
                usedSkills.set(skill, (usedSkills.get(skill) ?? 0) + 1);
            }
        }
        const skills = Array.from(usedSkills.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return { employers, unlinked, skills };
    }, [data, from, to, selectedEmployers]);

    const markdown = useMemo(() => {
        const lines: string[] = [];
        lines.push('# Experience');
        lines.push('');

        for (const emp of filtered.employers) {
            lines.push(`## ${emp.name} — ${emp.role}`);
            lines.push(`*${formatEmployerRange(emp.startDate, emp.endDate)}*`);
            if (emp.description) {
                lines.push('');
                lines.push(emp.description);
            }
            lines.push('');
            for (const entry of emp.entries) {
                lines.push(bulletFromEntry(entry));
            }
            lines.push('');
        }

        if (filtered.unlinked.length > 0) {
            lines.push('## Other');
            lines.push('');
            for (const entry of filtered.unlinked) {
                lines.push(bulletFromEntry(entry));
            }
            lines.push('');
        }

        if (filtered.skills.length > 0) {
            lines.push('# Skills');
            lines.push('');
            lines.push(filtered.skills.map(s => s.name).join(' · '));
            lines.push('');
        }

        return lines.join('\n').trim();
    }, [filtered]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback: select the textarea
        }
    };

    const download = () => {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${new Date().toISOString().substring(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
            {/* Filters */}
            <div className="bg-form-bg backdrop-blur-sm p-5 rounded-2xl border border-form-border space-y-5">
                <h2 className="text-lg font-semibold text-form-section-text border-b border-form-section-border pb-2">
                    Filters
                </h2>

                <div>
                    <label className="block text-sm font-medium text-form-label mb-2">Include</label>
                    <div className="space-y-2">
                        {data.employers.map(emp => (
                            <label key={emp.id} className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedEmployers.has(emp.id)}
                                    onChange={() => toggleEmployer(emp.id)}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="font-medium text-text-primary">{emp.name}</span>
                                    <span className="text-text-muted block text-xs">{emp.entries.length} entries</span>
                                </span>
                            </label>
                        ))}
                        <label className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedEmployers.has('unlinked')}
                                onChange={() => toggleEmployer('unlinked')}
                                className="mt-0.5"
                            />
                            <span>
                                <span className="font-medium text-text-primary">Other (no employer)</span>
                                <span className="text-text-muted block text-xs">{data.unlinkedEntries.length} entries</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div>
                    <label htmlFor="from" className="block text-sm font-medium text-form-label mb-2">From</label>
                    <input id="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="to" className="block text-sm font-medium text-form-label mb-2">To</label>
                    <input id="to" type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
                </div>

                <div className="pt-3 border-t border-form-section-border space-y-2">
                    <button
                        type="button"
                        onClick={copy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy markdown'}
                    </button>
                    <button
                        type="button"
                        onClick={download}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-form-cancel-border text-form-cancel-text hover:text-form-cancel-text-hover hover:border-form-cancel-border-hover font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download .md
                    </button>
                </div>
            </div>

            {/* Preview + markdown */}
            <div className="space-y-6">
                <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 md:p-8">
                    <h2 className="text-lg font-semibold text-text-primary border-b border-border-light pb-2 mb-4">
                        Preview
                    </h2>

                    {filtered.employers.length === 0 && filtered.unlinked.length === 0 ? (
                        <p className="text-text-muted text-center py-12">No entries match your filters.</p>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-text-primary">Experience</h3>
                            {filtered.employers.map(emp => (
                                <div key={emp.id} className="space-y-2">
                                    <div>
                                        <div className="font-bold text-text-primary text-lg">{emp.name} — {emp.role}</div>
                                        <div className="text-text-muted text-sm italic">{formatEmployerRange(emp.startDate, emp.endDate)}</div>
                                    </div>
                                    {emp.description && <p className="text-text-secondary text-sm">{emp.description}</p>}
                                    <ul className="space-y-1.5 pl-5 list-disc marker:text-text-muted">
                                        {emp.entries.map(e => (
                                            <li key={e.id} className="text-text-secondary text-sm">
                                                {e.actionVerb && <span className="font-semibold text-text-primary">{e.actionVerb} </span>}
                                                {e.title}
                                                {e.impact && <span className="text-green-700 dark:text-green-400"> — {e.impact}</span>}
                                                {e.techStack.length > 0 && (
                                                    <span className="text-text-muted italic"> ({e.techStack.join(', ')})</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {filtered.unlinked.length > 0 && (
                                <div className="space-y-2">
                                    <div className="font-bold text-text-primary text-lg">Other</div>
                                    <ul className="space-y-1.5 pl-5 list-disc marker:text-text-muted">
                                        {filtered.unlinked.map(e => (
                                            <li key={e.id} className="text-text-secondary text-sm">
                                                {e.actionVerb && <span className="font-semibold text-text-primary">{e.actionVerb} </span>}
                                                {e.title}
                                                {e.impact && <span className="text-green-700 dark:text-green-400"> — {e.impact}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {filtered.skills.length > 0 && (
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary mb-2">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {filtered.skills.map(s => (
                                            <span key={s.name} className="bg-badge-bg text-badge-text text-sm px-3 py-1 rounded-full font-medium">
                                                {s.name} <span className="opacity-60">×{s.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="md" className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wide block">
                        Markdown
                    </label>
                    <textarea
                        id="md"
                        readOnly
                        value={markdown}
                        rows={14}
                        className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-input-text font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}
