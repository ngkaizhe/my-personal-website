import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SetupForm } from './SetupForm';

export const metadata = {
    title: 'Set up your profile',
};

export default async function SetupPage() {
    const session = await auth();
    if (!session?.user) redirect('/');

    // Look up the live username from the DB — the JWT may be stale right after
    // a sign-in or right after a previous setup completes.
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            username: true,
            name: true,
            displayName: true,
            bio: true,
            image: true,
            contactEmail: true,
            linkedin: true,
            github: true,
            website: true,
        },
    });

    // First-time visitors set their username here; users who already have one
    // land on the same form pre-filled, as the profile editor.
    const isEdit = !!dbUser?.username;
    const t = await getTranslations('Setup');

    return (
        <div className="min-h-screen bg-page p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">{isEdit ? t('editTitle') : t('title')}</h1>
                    <p className="text-text-muted mt-2">
                        {isEdit
                            ? t('editSubtitle')
                            : t.rich('subtitle', {
                                urlExample: (chunks) => <span className="font-mono">{chunks}</span>,
                            })}
                    </p>
                </div>
                <SetupForm
                    defaultUsername={dbUser?.username ?? ''}
                    defaultDisplayName={dbUser?.displayName ?? dbUser?.name ?? ''}
                    defaultBio={dbUser?.bio ?? ''}
                    defaultImage={dbUser?.image ?? ''}
                    defaultContact={{
                        contactEmail: dbUser?.contactEmail ?? '',
                        linkedin: dbUser?.linkedin ?? '',
                        github: dbUser?.github ?? '',
                        website: dbUser?.website ?? '',
                    }}
                />
            </div>
        </div>
    );
}
