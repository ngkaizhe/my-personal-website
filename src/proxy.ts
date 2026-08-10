import { NextResponse, type NextRequest } from 'next/server';
import { isMainHost } from '@/lib/customDomain';

// Next.js 16 proxy (formerly middleware.ts). Deliberately thin: host-based
// forwarding for bound custom domains plus a pathname pass-through header.
// It holds no session logic — auth gating lives in the dashboard layout
// (src/app/dashboard/layout.tsx) and every server action independently
// re-checks via getCurrentUserId() — so it needs no NextAuth wrapper.
export default function proxy(req: NextRequest) {
    const { nextUrl } = req;

    // --- Custom domain branch -------------------------------------------
    // Everything on a bound domain is forwarded into the /d catch-all, which
    // resolves the owner's configurable path→view mapping (and bounces
    // unmapped paths to the main app) — the proxy itself stays DB-free.
    //
    // x-forwarded-host is preferred because Vercel re-invokes the proxy for
    // rewritten requests with an internal Host header. /d is the proxy's only
    // rewrite target, so a path already inside it must never be rewritten
    // again on that re-entrant pass.
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
    const isRewrittenTarget = nextUrl.pathname.startsWith('/d/');
    // Machine-readable endpoints resolve the user from the Host header
    // themselves, so they must reach their route handlers un-rewritten.
    const isHostAwareEndpoint =
        nextUrl.pathname === '/llms.txt' || nextUrl.pathname === '/resume.json';
    if (!isRewrittenTarget && !isHostAwareEndpoint && !isMainHost(host)) {
        const bare = host.toLowerCase().split(':')[0];
        // Whole-path rewrite: which paths render which view (and which
        // bounce to the main app) is user-configurable and lives in the DB,
        // so the /d/[domain]/[[...slug]] route owns that decision. The proxy
        // stays a dumb, DB-free forwarder.
        const rewritten = nextUrl.clone();
        rewritten.pathname = `/d/${bare}${nextUrl.pathname === '/' ? '' : nextUrl.pathname}`;
        return NextResponse.rewrite(rewritten);
    }
    // --------------------------------------------------------------------

    // Server layouts have no supported way to read the requested pathname;
    // the dashboard layout needs it to build the sign-in callbackUrl.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', nextUrl.pathname + nextUrl.search);
    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
