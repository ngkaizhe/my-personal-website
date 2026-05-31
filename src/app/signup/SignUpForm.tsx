'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { signUpWithEmail } from './actions';

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

const labelClass = 'block text-sm font-medium text-form-label mb-2';

export function SignUpForm() {
    const t = useTranslations('EmailAuth');
    const tLanding = useTranslations('Landing');
    const tCommon = useTranslations('Common');
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            try {
                const result = await signUpWithEmail(formData);
                // If signUp throws (the redirect), we never reach here. If it
                // returns success: false, surface the message.
                if (result && !result.success && result.error) {
                    setError(result.error);
                }
            } catch (err) {
                // Next.js redirect errors look like NEXT_REDIRECT — let them
                // bubble; everything else is a real failure.
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes('NEXT_REDIRECT')) throw err;
                setError(msg);
            }
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-form-bg backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-form-border shadow-2xl"
        >
            <div>
                <label htmlFor="signup-email" className={labelClass}>{t('email')}</label>
                <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@example.com"
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="signup-password" className={labelClass}>{t('password')}</label>
                <input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className={inputClass}
                />
                <p className="text-xs text-text-faint mt-1">{t('passwordHint')}</p>
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
                    {pending ? t('submitting') : t('submitSignUp')}
                </button>
                <p className="text-sm text-text-muted text-center">
                    {tLanding('haveAccount')}{' '}
                    <Link href="/signin" className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline">
                        {tLanding('signIn')}
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
