import NextAuth from 'next-auth';
import authConfig from '@/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
    // Don't run the middleware on Next internals or static files; the
    // authorized() callback decides per request whether to allow it.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
