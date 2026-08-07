'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, ShieldAlert, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import type { DomainStatus } from '@/lib/vercelDomains';
import { inputClass } from '@/lib/formStyles';
import { resolveDomainPaths } from '@/lib/domainPaths';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    setCustomDomain,
    checkDomainStatus,
    removeCustomDomain,
    saveDomainPaths,
    type DomainActionResult,
} from '@/app/dashboard/domain/actions';

type RootView = 'TIMELINE' | 'RESUME';

interface Props {
    initialDomain: string | null;
    initialStatus: DomainStatus | null;
    initialRootView: RootView;
    initialAltPath: string;
}

export default function DomainSettings({ initialDomain, initialStatus, initialRootView, initialAltPath }: Props) {
    const t = useTranslations('DomainSettings');
    const router = useRouter();
    const [input, setInput] = useState(initialDomain ?? '');
    const [domain, setDomain] = useState(initialDomain);
    const [status, setStatus] = useState(initialStatus);
    const [error, setError] = useState<string | null>(null);
    const initialPaths = resolveDomainPaths({ domainRootView: initialRootView, domainAltPath: initialAltPath });
    const [timelinePath, setTimelinePath] = useState(initialPaths.timelinePath);
    const [resumePath, setResumePath] = useState(initialPaths.resumePath);
    const [savedPaths, setSavedPaths] = useState(initialPaths);
    const [pathError, setPathError] = useState<string | null>(null);
    const [pathSaved, setPathSaved] = useState(false);
    const [confirming, setConfirming] = useState<'remove' | 'rebind' | null>(null);
    const [pending, startTransition] = useTransition();

    const pathsDirty = timelinePath !== savedPaths.timelinePath || resumePath !== savedPaths.resumePath;

    useEffect(() => {
        if (!pathSaved) return;
        const id = setTimeout(() => setPathSaved(false), 4000);
        return () => clearTimeout(id);
    }, [pathSaved]);

    const onSavePaths = () => startTransition(async () => {
        setPathSaved(false);
        const r = await saveDomainPaths(timelinePath, resumePath);
        if (r.ok) {
            setPathError(null);
            setPathSaved(true);
            setSavedPaths({ timelinePath, resumePath });
            router.refresh();
        } else if (r.error) {
            setPathError(t(`error_${r.error}`));
        }
    });

    const doBind = () => startTransition(async () => {
        const r: DomainActionResult = await setCustomDomain(input);
        setConfirming(null);
        if (r.ok) {
            setDomain(input.trim().toLowerCase());
            setStatus(r.status ?? null);
            setError(null);
            router.refresh();
        } else if (r.error) {
            setError(t(`error_${r.error}`));
        }
    });

    const onBindClick = () => {
        if (domain && input.trim().toLowerCase() !== domain) {
            setConfirming('rebind');
        } else {
            doBind();
        }
    };

    const onRecheck = () => startTransition(async () => {
        const r = await checkDomainStatus();
        if (r.ok) {
            setStatus(r.status ?? null);
            setError(null);
        }
    });

    const doRemove = () => startTransition(async () => {
        const r = await removeCustomDomain();
        setConfirming(null);
        if (r.ok) {
            setDomain(null);
            setStatus(null);
            setInput('');
            setError(null);
            router.refresh();
        } else if (r.error) {
            setError(t(`error_${r.error}`));
        }
    });

    const stateMeta: Record<DomainStatus['state'], { icon: React.ReactNode; label: string; cls: string }> = {
        active: { icon: <CheckCircle2 className="w-4 h-4" />, label: t('stateActive'), cls: 'text-green-600' },
        pending_dns: { icon: <Clock className="w-4 h-4" />, label: t('statePendingDns'), cls: 'text-amber-600' },
        needs_verification: { icon: <ShieldAlert className="w-4 h-4" />, label: t('stateNeedsVerification'), cls: 'text-amber-600' },
        not_found: { icon: <ShieldAlert className="w-4 h-4" />, label: t('stateNotFound'), cls: 'text-red-600' },
        error: { icon: <ShieldAlert className="w-4 h-4" />, label: t('stateError'), cls: 'text-red-600' },
    };

    const hasDnsRecords = !!status && (status.dnsRecords.length > 0 || status.verification.length > 0);

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                <label htmlFor="custom-domain" className="block text-base font-semibold text-text-primary">
                    {t('inputLabel')}
                </label>
                <div className="flex gap-2">
                    <input
                        id="custom-domain"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="yourname.com"
                        className={`flex-1 ${inputClass}`}
                    />
                    <button
                        type="button"
                        onClick={onBindClick}
                        disabled={pending || !input.trim()}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                        {domain ? t('rebind') : t('bind')}
                    </button>
                </div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-text-muted">{t('hint')}</p>
            </div>

            {domain && status && (
                <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className={`inline-flex items-center gap-2 text-sm font-medium ${stateMeta[status.state].cls}`}>
                            {stateMeta[status.state].icon}
                            <span className="font-mono">{domain}</span>
                            <span aria-hidden="true">·</span>
                            <span>{stateMeta[status.state].label}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onRecheck}
                                disabled={pending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-light text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> {t('recheck')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming('remove')}
                                disabled={pending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('remove')}
                            </button>
                        </div>
                    </div>

                    {status.state !== 'active' && (
                        <div className="space-y-3">
                            {hasDnsRecords ? (
                                <>
                                    <p className="text-sm text-text-secondary">{t('dnsInstructions')}</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-text-muted">
                                                <tr>
                                                    <th scope="col" className="py-1 pr-4 font-medium">{t('dnsType')}</th>
                                                    <th scope="col" className="py-1 pr-4 font-medium">{t('dnsName')}</th>
                                                    <th scope="col" className="py-1 font-medium">{t('dnsValue')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-mono text-text-primary">
                                                {status.dnsRecords.map((r) => (
                                                    <tr key={`${r.type}-${r.name}`}>
                                                        <td className="py-1 pr-4">{r.type}</td>
                                                        <td className="py-1 pr-4">{r.name}</td>
                                                        <td className="py-1 break-all">{r.value}</td>
                                                    </tr>
                                                ))}
                                                {status.verification.map((v) => (
                                                    <tr key={v.value}>
                                                        <td className="py-1 pr-4">{v.type}</td>
                                                        <td className="py-1 pr-4 break-all">{v.domain}</td>
                                                        <td className="py-1 break-all">{v.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-text-muted">{t('dnsNoRecords')}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {domain && (
                <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-text-primary">{t('pathsTitle')}</h2>
                    <p className="text-xs text-text-muted">{t('pathsHint')}</p>

                    {([
                        { key: 'timeline', label: t('viewTimeline'), value: timelinePath, set: setTimelinePath },
                        { key: 'resume', label: t('viewResume'), value: resumePath, set: setResumePath },
                    ] as const).map(row => (
                        <div key={row.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                            <span className="sm:w-20 shrink-0 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                                {row.label}
                                {status?.state === 'active' && (
                                    <a
                                        href={`https://${domain}${row.value === '/' ? '' : row.value}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={t('openPath', { view: row.label })}
                                        className="p-0.5 rounded text-text-muted hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                    </a>
                                )}
                            </span>
                            <div className="flex flex-1 items-center min-w-0 rounded-xl bg-input-bg border border-input-border hover:border-input-border-hover focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all duration-200">
                                <span className="pl-4 text-sm font-mono text-text-muted truncate shrink max-w-[55%]" aria-hidden="true">
                                    {domain}
                                </span>
                                <input
                                    id={`domain-path-${row.key}`}
                                    aria-label={t('pathFor', { view: row.label })}
                                    value={row.value}
                                    onChange={(e) => { row.set(e.target.value); setPathSaved(false); }}
                                    placeholder="/"
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none px-1 py-3 text-input-text placeholder-input-placeholder"
                                />
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-end gap-3">
                        {pathError && <p role="alert" className="text-sm text-red-600">{pathError}</p>}
                        {pathSaved && <p className="text-sm text-green-600">{t('pathsSaved')}</p>}
                        <button
                            type="button"
                            onClick={onSavePaths}
                            disabled={pending || !pathsDirty}
                            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            {t('savePaths')}
                        </button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirming === 'remove'}
                title={t('removeConfirmTitle')}
                description={t('removeConfirmBody', { domain: domain ?? '' })}
                confirmLabel={t('remove')}
                danger
                pending={pending}
                onConfirm={doRemove}
                onClose={() => setConfirming(null)}
            />
            <ConfirmDialog
                open={confirming === 'rebind'}
                title={t('rebindConfirmTitle')}
                description={t('rebindConfirmBody', { from: domain ?? '', to: input.trim().toLowerCase() })}
                confirmLabel={t('rebind')}
                pending={pending}
                onConfirm={doBind}
                onClose={() => setConfirming(null)}
            />
        </div>
    );
}
