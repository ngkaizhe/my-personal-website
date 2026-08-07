'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { normalizeDomain } from '@/lib/customDomain';
import { normalizeViewPaths } from '@/lib/domainPaths';
import {
    addDomainToProject,
    getDomainStatus,
    removeDomainFromProject,
    type DomainStatus,
} from '@/lib/vercelDomains';

export type DomainActionResult = {
    ok: boolean;
    error?: 'invalid' | 'taken' | 'vercel_failed';
    status?: DomainStatus;
};

export async function setCustomDomain(domainInput: string): Promise<DomainActionResult> {
    const userId = await getCurrentUserId();
    const domain = normalizeDomain(domainInput);
    if (!domain) return { ok: false, error: 'invalid' };

    const prev = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });

    // DB first: the unique constraint arbitrates races between users.
    try {
        await prisma.user.update({ where: { id: userId }, data: { customDomain: domain } });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return { ok: false, error: 'taken' };
        }
        throw e;
    }

    const added = await addDomainToProject(domain);
    if (!added.ok) {
        // Roll back so DB never claims a domain Vercel doesn't know about.
        await prisma.user.update({
            where: { id: userId },
            data: { customDomain: prev?.customDomain ?? null },
        });
        return { ok: false, error: 'vercel_failed' };
    }

    revalidatePath('/dashboard/domain');
    return { ok: true, status: await getDomainStatus(domain) };
}

export async function checkDomainStatus(): Promise<DomainActionResult> {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });
    if (!user?.customDomain) return { ok: false };
    return { ok: true, status: await getDomainStatus(user.customDomain) };
}

export async function removeCustomDomain(): Promise<DomainActionResult> {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });
    if (!user?.customDomain) return { ok: true };

    const removed = await removeDomainFromProject(user.customDomain);
    if (!removed.ok) return { ok: false, error: 'vercel_failed' };

    await prisma.user.update({ where: { id: userId }, data: { customDomain: null } });
    revalidatePath('/dashboard/domain');
    return { ok: true };
}

export async function saveDomainPaths(
    timelinePath: string,
    resumePath: string,
): Promise<{ ok: boolean; error?: 'invalid_path' | 'reserved_path' | 'need_root' }> {
    const userId = await getCurrentUserId();
    const normalized = normalizeViewPaths(timelinePath, resumePath);
    if (!normalized.ok) return { ok: false, error: normalized.error };
    await prisma.user.update({
        where: { id: userId },
        data: { domainRootView: normalized.rootView, domainAltPath: normalized.altPath },
    });
    revalidatePath('/dashboard/domain');
    return { ok: true };
}
