import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, auth: session } = req;

    // Pretty profile URLs: /@kaizhe -> /u/kaizhe (Next can't have a @-prefixed
    // dynamic folder, so the file system uses /u/[username] and middleware rewrites).
    if (nextUrl.pathname.startsWith('/@')) {
        const rewritten = nextUrl.clone();
        rewritten.pathname = '/u/' + nextUrl.pathname.slice(2);
        return NextResponse.rewrite(rewritten);
    }

    // Gate protected routes. authorized() callback only enforces this automatically
    // when middleware exports `auth` directly; with a custom handler we own the gate.
    const isProtected =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname === '/setup';
    if (isProtected && !session?.user) {
        return NextResponse.redirect(new URL('/', nextUrl));
    }

    // NOTE: we deliberately do NOT redirect "logged-in but no username" users
    // away from /dashboard. The JWT can carry username=null for the entire
    // lifetime of the cookie (because useSession().update() doesn't survive
    // the Credentials provider), so trusting that check creates an infinite
    // dashboard ↔ setup loop. Instead the UserMenu surfaces "Set up your
    // profile" when username is missing, and /setup itself is reachable for
    // any signed-in user. The dashboard reads userId for queries, not
    // username, so missing username never breaks data access.
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
