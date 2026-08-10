import { cache } from 'react';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

// Per-request dedupe for the username re-read in session(): pages that call
// auth() several times per request (layout + page + actions) share one DB hit.
// Outside a React request scope cache() transparently falls through.
const readUsername = cache(async (userId: string): Promise<string | null> => {
    const { prisma } = await import('@/lib/prisma');
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
    });
    return dbUser?.username ?? null;
});

// Adapter-free slice of the auth config: providers and callbacks. Only
// src/auth.ts consumes it today (the proxy no longer wraps NextAuth — auth
// gating moved into the dashboard layout), but the split keeps the config
// importable from adapter-free contexts.
export default {
    providers: [
        Google({
            // NextAuth v5 defaults to AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET; we use
            // GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to match Google Console naming.
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: 'Email',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
                const password = credentials?.password as string | undefined;
                if (!email || !password) return null;

                // Lazy import keeps Prisma + bcrypt out of the edge bundle.
                // authorize() only runs in Node (sign-in form POST), never in
                // middleware, so this dynamic import is fine.
                const { prisma } = await import('@/lib/prisma');
                const bcrypt = await import('bcryptjs');

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: { id: true, email: true, name: true, image: true, username: true, passwordHash: true },
                });
                if (!user?.passwordHash) return null;
                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return {
                    id: user.id,
                    email: user.email ?? undefined,
                    name: user.name ?? undefined,
                    image: user.image ?? undefined,
                    username: user.username ?? null,
                };
            },
        }),
        // Zero-friction demo signin: clicking "Try as Demo" on the landing
        // page POSTs no credentials and just resolves to the seeded demo user.
        // The provider only succeeds if a User with username='demo' exists, so
        // it can't be used to log into anyone else's account.
        Credentials({
            id: 'demo',
            name: 'Demo',
            credentials: {},
            async authorize() {
                const { prisma } = await import('@/lib/prisma');
                const user = await prisma.user.findUnique({
                    where: { username: 'demo' },
                    select: { id: true, email: true, name: true, image: true, username: true },
                });
                if (!user) return null;
                return {
                    id: user.id,
                    email: user.email ?? undefined,
                    name: user.name ?? undefined,
                    image: user.image ?? undefined,
                    username: user.username ?? null,
                };
            },
        }),
    ],
    session: { strategy: 'jwt' },
    pages: {
        // When middleware blocks an unauth request, send them to our landing page
        // instead of NextAuth's built-in /api/auth/signin.
        signIn: '/',
    },
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
                // Always re-read username from the DB rather than trusting the
                // JWT snapshot. The JWT is signed at signin time, so any later
                // /setup save (or username edit) wouldn't show until the user
                // signed out + back in. The middleware runs on nodejs runtime,
                // so a lazy Prisma import here is safe everywhere session() is
                // called. One DB query per request is fine at this scale.
                try {
                    session.user.username = await readUsername(token.sub as string);
                } catch {
                    // Fall back to the JWT snapshot if the DB is unreachable.
                    session.user.username = (token.username as string | null) ?? null;
                }
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
