'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { revalidatePath } from 'next/cache';

export interface SetupInput {
    username: string;
    displayName: string;
    bio: string;
}

export interface SetupResult {
    success: boolean;
    error?: string;
}

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;
// Reserved so a future static route or system path can't be hijacked.
const RESERVED_USERNAMES = new Set([
    'admin', 'api', 'dashboard', 'setup', 'login', 'logout',
    'signin', 'signout', 'auth', 'u', 'static', 'public',
    '_next', 'favicon', 'robots', 'sitemap', 'demo',
]);

export async function saveSetup(input: SetupInput): Promise<SetupResult> {
    const userId = await getCurrentUserId();

    const username = input.username.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const bio = input.bio.trim();

    if (!USERNAME_PATTERN.test(username)) {
        return {
            success: false,
            error: 'Username must be 3–30 chars, lowercase letters, numbers, hyphen or underscore.',
        };
    }
    if (RESERVED_USERNAMES.has(username)) {
        return { success: false, error: 'That username is reserved. Pick another.' };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                displayName: displayName || null,
                bio: bio || null,
            },
        });
    } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
            // P2002 = unique constraint violation (username taken)
            if (err.code === 'P2002') {
                return { success: false, error: 'That username is already taken.' };
            }
            // P2025 = update target row not found. The JWT cookie outlived the User row
            // (most often after a db:reset). The user needs to sign out and back in to
            // get a fresh User row created by the OAuth flow.
            if (err.code === 'P2025') {
                return {
                    success: false,
                    error: 'Your session is stale (likely because the database was reset). Please sign out and sign in again.',
                };
            }
        }
        throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath(`/@${username}`);
    return { success: true };
}
