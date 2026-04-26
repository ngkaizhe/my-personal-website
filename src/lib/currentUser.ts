import { auth } from '@/auth';
import { prisma } from './prisma';

// TODO(task-4): drop the demo-user fallback and the function should throw
// when there's no session — strict per-user scoping comes with the middleware
// and full session wiring in Task 4.
export async function getCurrentUserId(): Promise<string> {
    const session = await auth();
    if (session?.user?.id) return session.user.id;

    // Fallback while sign-in UI is not yet wired (pre-Task 5): write into demo.
    const demo = await prisma.user.findUnique({ where: { username: 'demo' } });
    if (!demo) {
        throw new Error('No session and demo user not found — run `npm run db:seed`.');
    }
    return demo.id;
}
