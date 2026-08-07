import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';
import { isMainHost } from '@/lib/customDomain';
import { isProtectedPath } from '@/lib/routes';

// Next.js 16 proxy (formerly middleware.ts — the file convention was renamed;
// behavior is identical and it runs on the Node runtime, which we need because
// the Credentials provider compiled into auth.config.ts pushes the bundle past
// the 1MB edge limit and dynamically imports Prisma + bcryptjs).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, auth: session } = req;

    // --- Custom domain branch -------------------------------------------
    // A bound domain serves only the owner's two public pages; everything
    // else bounces to the main app. Pure string logic: the /d/[domain]
    // pages own the DB lookup so the proxy stays DB-free.
    //
    // x-forwarded-host is preferred because Vercel re-invokes the proxy for
    // rewritten requests with an internal Host header; acting on that value
    // turned the /@ -> /u rewrite into a visible 307 on *.vercel.app hosts.
    // Rewrite targets (/u, /d) are likewise skipped so a re-entrant pass can
    // never bounce a path the first pass just rewrote to.
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const isInternalTarget =
        nextUrl.pathname.startsWith('/u/') || nextUrl.pathname.startsWith('/d/');
    if (!isInternalTarget && !isMainHost(host)) {
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
    // dynamic folder, so the file system uses /u/[username] and the proxy rewrites).
    if (nextUrl.pathname.startsWith('/@')) {
        const rewritten = nextUrl.clone();
        rewritten.pathname = '/u/' + nextUrl.pathname.slice(2);
        return NextResponse.rewrite(rewritten);
    }

    // Gate protected routes. authorized() callback only enforces this automatically
    // when the proxy exports `auth` directly; with a custom handler we own the gate.
    // callbackUrl lets the landing page bounce the user back to where they were
    // headed once they sign in.
    if (isProtectedPath(nextUrl.pathname) && !session?.user) {
        const signInUrl = new URL('/', nextUrl);
        signInUrl.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search);
        return NextResponse.redirect(signInUrl);
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
