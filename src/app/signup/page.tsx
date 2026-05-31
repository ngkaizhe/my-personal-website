import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { SignUpForm } from './SignUpForm';

export const metadata = {
    title: 'Create your account',
};

export default async function SignUpPage() {
    const session = await auth();
    if (session?.user) {
        redirect('/dashboard');
    }
    const t = await getTranslations('EmailAuth');

    return (
        <main className="min-h-screen bg-page flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                        {t('signUpHeading')}
                    </h1>
                    <p className="text-sm text-text-muted">
                        {t('signUpSubtitle')}
                    </p>
                </div>
                <SignUpForm />
            </div>
        </main>
    );
}
