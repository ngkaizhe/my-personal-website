import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [Google],
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // On sign-in, user is present; persist the id and username onto the token
            if (user) {
                token.sub = user.id;
                token.username = (user as { username?: string | null }).username ?? null;
            }
            // When a client calls update() after the setup flow, refresh the token
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
    },
});
