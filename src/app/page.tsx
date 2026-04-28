import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogIn } from 'lucide-react';
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

    return (
        <main className="min-h-screen bg-page flex items-center justify-center px-6 py-12">
            <div className="max-w-3xl w-full space-y-8 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-text-primary tracking-tight">
                    Track. Reflect. Resume.
                </h1>
                <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
                    A daily work log that becomes your résumé. Capture what you shipped, watch it compose itself into bullets — and share it at your own URL.
                </p>

                <form
                    action={async () => {
                        'use server';
                        await signIn('google', { redirectTo: callbackUrl });
                    }}
                    className="flex justify-center"
                >
                    <button
                        type="submit"
                        className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-lg transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 cursor-pointer"
                    >
                        <LogIn className="w-5 h-5" />
                        Sign in with Google
                    </button>
                </form>

                <p className="text-sm text-text-faint">
                    See an example portfolio:{' '}
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
