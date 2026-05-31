'use server';

import { signIn } from '@/auth';

export interface SignInResult {
    success: boolean;
    error?: string;
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
        // NEXT_REDIRECT is the success path. Anything else is bad credentials
        // or a runtime error. NextAuth folds bad-creds into a generic error,
        // so don't try to differentiate the message.
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NEXT_REDIRECT')) throw err;
        if (msg.includes('CredentialsSignin') || msg.includes('CallbackRouteError')) {
            return { success: false, error: 'invalidCredentials' };
        }
        return { success: false, error: msg };
    }
}
