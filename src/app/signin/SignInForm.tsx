'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signInWithEmail } from './actions';

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
    callbackUrl: string;
}

export function SignInForm({ callbackUrl }: Props) {
    const t = useTranslations('EmailAuth');
    const tLanding = useTranslations('Landing');
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            try {
                const result = await signInWithEmail(formData, callbackUrl);
                if (result && !result.success && result.error) {
                    // The action returns message keys, never raw error text.
                    setError(result.error === 'invalidCredentials' ? t('invalidCredentials') : t('signInFailed'));
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes('NEXT_REDIRECT')) throw err;
                setError(t('signInFailed'));
            }
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-form-bg backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-form-border shadow-2xl"
        >
            <div>
                <label htmlFor="signin-email" className={labelClass}>{t('email')}</label>
                <input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@example.com"
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="signin-password" className={labelClass}>{t('password')}</label>
                <input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className={inputClass}
                />
            </div>

            {error && (
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
                <button
                    type="submit"
                    disabled={pending}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                >
                    {pending ? t('submitting') : t('submitSignIn')}
                </button>
                <p className="text-sm text-text-muted text-center">
                    {tLanding('noAccount')}{' '}
                    <Link href="/signup" className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline">
                        {tLanding('signUpWithEmail')}
                    </Link>
                </p>
                <Link
                    href="/"
                    className="text-sm text-text-faint hover:text-text-muted text-center"
                >
                    ← {t('back')}
                </Link>
            </div>
        </form>
    );
}
