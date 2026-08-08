'use server';

import { AuthError } from 'next-auth';
import { unstable_rethrow } from 'next/navigation';
import { signIn } from '@/auth';

export interface SignInResult {
    success: boolean;
    error?: string;
}

// Google OAuth entry for the /signin page, so users who land here directly
// (instead of via the landing page) still get the OAuth option.
export async function signInWithGoogle(callbackUrl: string): Promise<void> {
    await signIn('google', { redirectTo: callbackUrl });
}

// Wraps NextAuth's Credentials sign-in so the client doesn't import the
// next-auth helpers directly. Throws to redirect on success.
export async function signInWithEmail(formData: FormData, callbackUrl: string): Promise<SignInResult> {
    const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
    const password = (formData.get('password') as string | null) ?? '';
    if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
    }
    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: callbackUrl,
        });
        return { success: true };
    } catch (err) {
        // The redirect "error" is the success path — unstable_rethrow lets
        // Next's own control-flow errors (redirect/notFound) pass through and
        // returns normally for everything else.
        unstable_rethrow(err);
        // Typed check instead of message sniffing; NextAuth folds bad-creds
        // into these error types. Never leak raw error messages to the client.
        if (err instanceof AuthError) {
            return { success: false, error: 'invalidCredentials' };
        }
        return { success: false, error: 'signInFailed' };
    }
}
