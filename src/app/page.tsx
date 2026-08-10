import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogIn, Mail, Sparkles, FileText } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth, signIn } from '@/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LocaleToggle } from '@/components/ui/LocaleToggle';

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string }>;
}) {
    const session = await auth();
    if (session?.user) {
        redirect('/dashboard');
    }

    // Middleware passes ?callbackUrl=... when redirecting unauth users from
    // a protected route. Send them back there after sign-in. Only accept
    // internal paths so the param can't be turned into an open redirect.
    const params = await searchParams;
    const rawCallback = params.callbackUrl;
    const callbackUrl = rawCallback && rawCallback.startsWith('/') && !rawCallback.startsWith('//')
        ? rawCallback
        : '/dashboard';

    const t = await getTranslations('Landing');
    const tAuth = await getTranslations('Auth');

    return (
        <div className="min-h-screen bg-page flex flex-col">
            <header className="flex justify-between items-center px-6 py-4 max-w-6xl w-full mx-auto">
                <span className="text-base font-bold text-text-primary tracking-tight">{t('brand')}</span>
                <div className="flex items-center gap-2">
                    <LocaleToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-6 py-8">
                <div className="max-w-4xl w-full space-y-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-text-primary tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md mx-auto">
                        <form
                            action={async () => {
                                'use server';
                                await signIn('google', { redirectTo: callbackUrl });
                            }}
                            className="flex-1"
                        >
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 cursor-pointer"
                            >
                                <LogIn className="w-5 h-5 shrink-0" />
                                {tAuth('signInWithGoogle')}
                            </button>
                        </form>
                        <Link
                            href={`/signin${callbackUrl !== '/dashboard' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                        >
                            <Mail className="w-5 h-5 shrink-0" />
                            {t('signInWithEmail')}
                        </Link>
                    </div>

                    <div className="max-w-md mx-auto">
                        <form
                            action={async () => {
                                'use server';
                                await signIn('demo', { redirectTo: '/dashboard' });
                            }}
                        >
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 border border-blue-500/40 font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                            >
                                <Sparkles className="w-5 h-5 shrink-0" />
                                {t('tryAsDemo')}
                            </button>
                        </form>
                    </div>

                    <p className="text-sm text-text-faint">
                        {t('noAccount')}{' '}
                        <Link href="/signup" className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline">
                            {t('signUpWithEmail')}
                        </Link>
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 text-left pt-4">
                        <div className="bg-surface border border-border-light rounded-2xl p-5 space-y-3 shadow-sm">
                            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{t('previewTimelineCaption')}</p>
                            <div className="bg-surface-elevated border border-border-light rounded-xl p-4 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 font-medium" data-palette-accent>{t('previewMockTag')}</span>
                                    <span className="text-text-faint">2026/03</span>
                                </div>
                                <p className="text-sm font-semibold text-text-primary">
                                    <span className="text-sky-600">{t('previewMockVerb')}</span> {t('previewMockTitle')}
                                </p>
                                <p className="text-xs text-green-600">✦ {t('previewMockImpact')}</p>
                            </div>
                            <div className="bg-surface-elevated border border-border-light rounded-xl p-4 space-y-1.5 opacity-70">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-medium" data-palette-accent>★</span>
                                    <span className="text-text-faint">2025/09</span>
                                </div>
                                <p className="text-sm font-semibold text-text-primary">
                                    <span className="text-purple-600">{t('previewMockVerb2')}</span> {t('previewMockTitle2')}
                                </p>
                                <p className="text-xs text-green-600">✦ {t('previewMockImpact2')}</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-border-light rounded-2xl p-5 space-y-3 shadow-sm">
                            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{t('previewResumeCaption')}</p>
                            <div className="bg-surface-elevated border border-border-light rounded-xl p-4 space-y-2 font-mono text-xs text-text-secondary leading-relaxed">
                                <p className="flex items-center gap-2 text-text-primary font-semibold not-italic">
                                    <FileText className="w-3.5 h-3.5 shrink-0 text-text-muted" aria-hidden="true" /> resume.md
                                </p>
                                <p>- <strong>{t('previewMockVerb')}</strong> {t('previewMockTitle')} — {t('previewMockImpact')}</p>
                                <p>- <strong>{t('previewMockVerb2')}</strong> {t('previewMockTitle2')} — {t('previewMockImpact2')}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-text-faint">
                        {t('seeExample')}{' '}
                        <Link
                            href="/u/demo"
                            className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline"
                        >
                            /u/demo
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
