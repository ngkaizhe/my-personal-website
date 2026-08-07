import { getTranslations } from 'next-intl/server';
import { mainAppHost } from '@/lib/customDomain';

export default async function DomainNotBound({ domain }: { domain: string }) {
    const t = await getTranslations('DomainNotBound');
    const appHost = mainAppHost();
    return (
        <div className="bg-page min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-4">
                <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
                <p className="text-text-secondary">{t('description', { domain })}</p>
                {appHost && (
                    <a
                        href={`https://${appHost}`}
                        className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                        {t('cta')}
                    </a>
                )}
            </div>
        </div>
    );
}
