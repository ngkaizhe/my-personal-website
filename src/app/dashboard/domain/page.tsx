import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { getDomainStatus, type DomainStatus } from '@/lib/vercelDomains';
import DomainSettings from '@/components/Domain/DomainSettings';

export async function generateMetadata() {
    const t = await getTranslations('DomainSettings');
    return { title: t('title') };
}

export default async function DomainPage() {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });
    const domain = user?.customDomain ?? null;
    let status: DomainStatus | null = null;
    if (domain) {
        status = await getDomainStatus(domain);
    }
    const t = await getTranslations('DomainSettings');

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('title')}</h1>
                <p className="text-text-muted mt-1">{t('subtitle')}</p>
            </div>
            <DomainSettings initialDomain={domain} initialStatus={status} />
        </div>
    );
}
