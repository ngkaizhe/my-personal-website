import { cache } from 'react';
import { prisma } from '@/lib/prisma';

// Resolves a bound custom domain to its owner's username. Wrapped in React
// cache() so generateMetadata and the page body share one DB hit per request.
// Server-only (Prisma) — middleware must keep using lib/customDomain instead.
export const usernameForDomain = cache(async (domain: string): Promise<string | null> => {
    const user = await prisma.user.findUnique({
        where: { customDomain: domain.toLowerCase() },
        select: { username: true },
    });
    return user?.username ?? null;
});
