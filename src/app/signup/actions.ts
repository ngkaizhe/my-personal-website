'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export interface SignUpResult {
    success: boolean;
    error?: string;
}

// Creates a new email+password user, then signs them in. No verification email
// — the intent is friction-free demo signup. Real-email users still benefit
// from the password gate; throwaway demo emails (test@test.com) just work.
export async function signUpWithEmail(formData: FormData): Promise<SignUpResult> {
    const emailRaw = (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
    const password = (formData.get('password') as string | null) ?? '';

    if (!EMAIL_RE.test(emailRaw)) {
        return { success: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < MIN_PASSWORD) {
        return { success: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
    }

    const existing = await prisma.user.findUnique({
        where: { email: emailRaw },
        select: { id: true, passwordHash: true },
    });
    if (existing) {
        // Don't reveal whether the email is taken vs already-Google-linked —
        // collapses two failure modes into one and avoids enumeration.
        return { success: false, error: 'That email is already in use. Try signing in instead.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            email: emailRaw,
            passwordHash,
            // No name / username yet — /setup collects those after first login.
        },
    });

    // signIn from NextAuth handles the redirect itself by throwing. We let it
    // propagate; Next.js treats the redirect as the action's response.
    await signIn('credentials', {
        email: emailRaw,
        password,
        redirectTo: '/setup',
    });

    // Unreachable in the success case (signIn throws to redirect). Keeps TS
    // happy + provides a fallback for testing without the redirect side-effect.
    return { success: true };
}
