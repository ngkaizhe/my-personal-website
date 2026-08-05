import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';
import { isMainHost } from '@/lib/customDomain';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, auth: session } = req;

    // --- Custom domain branch -------------------------------------------
    // A bound domain serves only the owner's two public pages; everything
    // else bounces to the main app. Pure string logic: the /d/[domain]
    // pages own the DB lookup so middleware stays DB-free.
    const host = req.headers.get('host') ?? '';
    if (!isMainHost(host)) {
        const bare = host.toLowerCase().split(':')[0];
        if (nextUrl.pathname === '/') {
            const rewritten = nextUrl.clone();
            rewritten.pathname = `/d/${bare}`;
            return NextResponse.rewrite(rewritten);
        }
        if (nextUrl.pathname === '/resume') {
            const rewritten = nextUrl.clone();
            rewritten.pathname = `/d/${bare}/resume`;
            return NextResponse.rewrite(rewritten);
        }
        const appHost = process.env.NEXT_PUBLIC_APP_HOST;
        if (appHost) {
            return NextResponse.redirect(
                new URL(nextUrl.pathname + nextUrl.search, `https://${appHost}`),
                307,
            );
        }
        // NEXT_PUBLIC_APP_HOST unset: fall through and serve normally rather
        // than risk a redirect loop.
    }
    // --------------------------------------------------------------------

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

// Pinned to nodejs runtime because the Credentials provider compiled into
// auth.config.ts pushes the bundle past Vercel's 1MB edge limit. Node runtime
// raises the limit to 250MB and gives us a proper require() so the dynamic
// imports of @/lib/prisma + bcryptjs in authorize() don't get statically
// bundled into the edge graph. Cold-start cost (~50ms vs ~5ms) is negligible
// for a personal portfolio.
export const config = {
    runtime: 'nodejs',
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
