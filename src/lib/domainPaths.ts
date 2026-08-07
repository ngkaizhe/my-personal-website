// PURE module — imported by the settings client component and by server
// routes alike, so it must never touch Prisma.

export type DomainPathConfig = {
    domainRootView: 'TIMELINE' | 'RESUME';
    domainAltPath: string;
};

/**
 * The invariant "exactly one view is at /" lets two columns encode the whole
 * mapping: the root view sits at /, the other view at domainAltPath.
 */
export function resolveDomainPaths(cfg: DomainPathConfig): { timelinePath: string; resumePath: string } {
    return cfg.domainRootView === 'TIMELINE'
        ? { timelinePath: '/', resumePath: cfg.domainAltPath }
        : { timelinePath: cfg.domainAltPath, resumePath: '/' };
}

// Route namespaces the alt path must never shadow. `resume` is deliberately
// absent — it is the default alt path.
export const RESERVED_PATH_SEGMENTS: ReadonlySet<string> = new Set([
    'u', 'd', 'api', 'dashboard', 'setup', 'signin', 'signup', '_next',
]);

const ALT_PATH_RE = /^\/[a-z0-9][a-z0-9-]*$/;

export function normalizeAltPath(
    input: string,
): { ok: true; path: string } | { ok: false; error: 'invalid_path' | 'reserved_path' } {
    let s = input.trim().toLowerCase();
    if (s && !s.startsWith('/')) s = `/${s}`;
    if (!ALT_PATH_RE.test(s)) return { ok: false, error: 'invalid_path' };
    if (RESERVED_PATH_SEGMENTS.has(s.slice(1))) return { ok: false, error: 'reserved_path' };
    return { ok: true, path: s };
}
