import { redirect } from 'next/navigation';
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
        select: { username: true, name: true },
    });

    if (dbUser?.username) {
        // Already set up — there's nothing to do here yet.
        redirect('/dashboard');
    }

    return (
        <main className="min-h-screen bg-page p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Set up your profile</h1>
                    <p className="text-text-muted mt-2">
                        Pick a username so people can find your public timeline at <span className="font-mono">/@yourname</span>.
                    </p>
                </div>
                <SetupForm defaultDisplayName={dbUser?.name ?? ''} />
            </div>
        </main>
    );
}
