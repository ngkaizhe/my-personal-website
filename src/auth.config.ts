import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

// Edge-safe slice of the auth config: providers, callbacks, route gating.
// Imported by both src/auth.ts (Node, with Prisma adapter) and src/middleware.ts
// (edge runtime, no Prisma allowed).
export default {
    providers: [
        Google({
            // NextAuth v5 defaults to AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET; we use
            // GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to match Google Console naming.
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.username = (user as { username?: string | null }).username ?? null;
            }
            if (trigger === 'update' && session?.user?.username !== undefined) {
                token.username = session.user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.username = (token.username as string | null) ?? null;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isAuthenticated = !!auth;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) return isAuthenticated;
            return true;
        },
    },
} satisfies NextAuthConfig;
