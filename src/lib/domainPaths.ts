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
// absent — it is the default alt path. skills/year/entry are the public
// sub-pages the /d catch-all serves on bound domains; letting a view path
// claim them would shadow those pages.
export const RESERVED_PATH_SEGMENTS: ReadonlySet<string> = new Set([
    'u', 'd', 'api', 'dashboard', 'setup', 'signin', 'signup', '_next',
    'skills', 'year', 'entry',
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

/**
 * UI model: the user edits both views' paths directly. Converts that pair
 * back into the storage model (rootView + altPath), enforcing the invariant
 * that exactly one path is "/".
 */
export function normalizeViewPaths(
    timelineInput: string,
    resumeInput: string,
):
    | { ok: true; rootView: 'TIMELINE' | 'RESUME'; altPath: string }
    | { ok: false; error: 'invalid_path' | 'reserved_path' | 'need_root' } {
    const t = timelineInput.trim();
    const r = resumeInput.trim();
    const tIsRoot = t === '/';
    const rIsRoot = r === '/';
    if (tIsRoot === rIsRoot) return { ok: false, error: 'need_root' };

    const alt = normalizeAltPath(tIsRoot ? r : t);
    if (!alt.ok) return alt;
    return tIsRoot
        ? { ok: true, rootView: 'TIMELINE', altPath: alt.path }
        : { ok: true, rootView: 'RESUME', altPath: alt.path };
}
