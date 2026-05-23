import Link from 'next/link';
import { UserSearch, Home, LogIn } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const metadata = {
    title: 'Profile not found',
};

export default async function ProfileNotFound() {
    const t = await getTranslations('NotFound');

    return (
        <main className="min-h-screen bg-page flex items-center justify-center px-6 py-12">
            <div className="max-w-xl w-full space-y-8 text-center">
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-surface-elevated border border-border-light flex items-center justify-center">
                        <UserSearch className="w-10 h-10 text-text-muted" aria-hidden="true" />
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-xs font-mono text-text-faint tracking-widest uppercase">{t('label')}</p>
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
                        {t('heading')}
                    </h1>
                    <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-md mx-auto">
                        {t('body')}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 cursor-pointer"
                    >
                        <LogIn className="w-4 h-4" aria-hidden="true" />
                        {t('claim')}
                    </Link>
                    <Link
                        href="/@demo"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-light font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                        <Home className="w-4 h-4" aria-hidden="true" />
                        {t('seeDemo')}
                    </Link>
                </div>
            </div>
        </main>
    );
}
