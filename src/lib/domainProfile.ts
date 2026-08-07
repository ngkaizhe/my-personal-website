import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { resolveDomainPaths } from '@/lib/domainPaths';

// Resolves a bound custom domain to its owner's username plus the owner's
// path→view mapping. One cached DB hit per request shared by generateMetadata
// and the page body. Server-only (Prisma) — the proxy must keep using
// lib/customDomain's pure helpers instead.
export const domainProfile = cache(async (domain: string) => {
    const user = await prisma.user.findUnique({
        where: { customDomain: domain.toLowerCase() },
        select: { username: true, domainRootView: true, domainAltPath: true },
    });
    if (!user?.username) return null;
    return { username: user.username, ...resolveDomainPaths(user) };
});
