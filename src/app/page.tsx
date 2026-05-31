import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogIn, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth, signIn } from '@/auth';

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
        <main className="min-h-screen bg-page flex items-center justify-center px-6 py-12">
            <div className="max-w-3xl w-full space-y-8 text-center">
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
                            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 cursor-pointer"
                        >
                            <LogIn className="w-5 h-5" />
                            {tAuth('signInWithGoogle')}
                        </button>
                    </form>
                    <Link
                        href={`/signin${callbackUrl !== '/dashboard' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                        <Mail className="w-5 h-5" />
                        {t('signInWithEmail')}
                    </Link>
                </div>

                <p className="text-sm text-text-faint">
                    {t('noAccount')}{' '}
                    <Link href="/signup" className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline">
                        {t('signUpWithEmail')}
                    </Link>
                </p>

                <p className="text-sm text-text-faint">
                    {t('seeExample')}{' '}
                    <Link
                        href="/@demo"
                        className="text-blue-600 hover:text-blue-500 underline-offset-2 hover:underline"
                    >
                        /@demo
                    </Link>
                </p>
            </div>
        </main>
    );
}
