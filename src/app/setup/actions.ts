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
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
            return { success: false, error: 'That username is already taken.' };
        }
        throw err;
    }

    revalidatePath('/dashboard');
    revalidatePath(`/@${username}`);
    return { success: true };
}
