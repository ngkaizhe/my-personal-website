// Single definition of which paths require a signed-in user. Consumed by both
// the proxy (redirect gate) and auth.config's authorized() callback so the
// two can't drift.

export function isProtectedPath(pathname: string): boolean {
    return pathname.startsWith('/dashboard') || pathname === '/setup';
}
