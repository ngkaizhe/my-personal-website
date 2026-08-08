import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { SignInForm } from './SignInForm';

export const metadata = {
    title: 'Sign in',
};

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string }>;
}) {
    const session = await auth();
    if (session?.user) {
        redirect('/dashboard');
    }

    const params = await searchParams;
    const rawCallback = params.callbackUrl;
    const callbackUrl = rawCallback && rawCallback.startsWith('/') && !rawCallback.startsWith('//')
        ? rawCallback
        : '/dashboard';

    const t = await getTranslations('EmailAuth');
    const tLanding = await getTranslations('Landing');

    return (
        <main className="min-h-screen bg-page flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <Link href="/" className="text-sm font-bold text-text-muted hover:text-text-primary tracking-tight transition-colors">
                        {tLanding('brand')}
                    </Link>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                        {t('signInHeading')}
                    </h1>
                </div>
                <SignInForm callbackUrl={callbackUrl} />
            </div>
        </main>
    );
}
