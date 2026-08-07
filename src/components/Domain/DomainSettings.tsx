'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import type { DomainStatus } from '@/lib/vercelDomains';
import { inputClass } from '@/lib/formStyles';
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
    const [rootView, setRootView] = useState<RootView>(initialRootView);
    const [altPath, setAltPath] = useState(initialAltPath);
    const [pathError, setPathError] = useState<string | null>(null);
    const [pathSaved, setPathSaved] = useState(false);
    const [pending, startTransition] = useTransition();

    const onSavePaths = () => startTransition(async () => {
        setPathSaved(false);
        const r = await saveDomainPaths(rootView, altPath);
        if (r.ok) {
            setPathError(null);
            setPathSaved(true);
            router.refresh();
        } else if (r.error) {
            setPathError(t(`error_${r.error}`));
        }
    });

    const onBind = () => startTransition(async () => {
        const r: DomainActionResult = await setCustomDomain(input);
        if (r.ok) {
            setDomain(input.trim().toLowerCase());
            setStatus(r.status ?? null);
            setError(null);
            router.refresh();
        } else if (r.error) {
            setError(t(`error_${r.error}`));
        }
    });

    const onRecheck = () => startTransition(async () => {
        const r = await checkDomainStatus();
        if (r.ok) {
            setStatus(r.status ?? null);
            setError(null);
        }
    });

    const onRemove = () => startTransition(async () => {
        const r = await removeCustomDomain();
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

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                <label htmlFor="custom-domain" className="block text-sm font-medium text-text-secondary">
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
                        onClick={onBind}
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
                                onClick={onRemove}
                                disabled={pending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('remove')}
                            </button>
                        </div>
                    </div>

                    {status.state !== 'active' && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary">{t('dnsInstructions')}</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-text-muted">
                                        <tr>
                                            <th scope="col" className="py-1 pr-4 font-medium">Type</th>
                                            <th scope="col" className="py-1 pr-4 font-medium">Name</th>
                                            <th scope="col" className="py-1 font-medium">Value</th>
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
                        </div>
                    )}
                </div>
            )}

            {domain && (
                <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-medium text-text-secondary">{t('pathsTitle')}</h2>
                    <fieldset className="space-y-2">
                        <legend className="text-sm text-text-secondary mb-1">{t('homepageShows')}</legend>
                        {(['TIMELINE', 'RESUME'] as const).map(v => (
                            <label key={v} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                                <input
                                    type="radio"
                                    name="domain-root-view"
                                    checked={rootView === v}
                                    onChange={() => { setRootView(v); setPathSaved(false); }}
                                    className="accent-blue-600"
                                />
                                {v === 'TIMELINE' ? t('viewTimeline') : t('viewResume')}
                            </label>
                        ))}
                    </fieldset>
                    <div>
                        <label htmlFor="domain-alt-path" className="block text-sm font-medium text-text-secondary mb-1">
                            {t('altPathLabel', { view: rootView === 'TIMELINE' ? t('viewResume') : t('viewTimeline') })}
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-text-muted shrink-0">{domain}</span>
                            <input
                                id="domain-alt-path"
                                value={altPath}
                                onChange={(e) => { setAltPath(e.target.value); setPathSaved(false); }}
                                placeholder="/resume"
                                className={`flex-1 ${inputClass}`}
                            />
                            <button
                                type="button"
                                onClick={onSavePaths}
                                disabled={pending}
                                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                                {t('savePaths')}
                            </button>
                        </div>
                        {pathError && <p role="alert" className="mt-2 text-sm text-red-600">{pathError}</p>}
                        {pathSaved && <p className="mt-2 text-sm text-green-600">{t('pathsSaved')}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
