import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

// Edge-safe slice of the auth config: providers, callbacks, route gating.
// Imported by both src/auth.ts (Node, with Prisma adapter) and src/middleware.ts
// (edge runtime, no Prisma allowed).
//
// The Credentials provider's authorize() callback below uses bcryptjs +
// prisma, which are Node-only. NextAuth v5 still hands these off to a Node
// runtime invocation, so the middleware never actually runs them — it only
// inspects the JWT. Keeping the provider declared here is safe.
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
                session.user.username = (token.username as string | null) ?? null;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isAuthenticated = !!auth;
            const isProtected =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname === '/setup';
            if (isProtected) return isAuthenticated;
            return true;
        },
    },
} satisfies NextAuthConfig;
