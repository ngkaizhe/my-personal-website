# Custom Domain Path → View Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Owners choose which public view (timeline / résumé) lives at which path on their bound custom domain, configured from `/dashboard/domain`; one view is always at `/`.

**Architecture:** Two new User columns (`domainRootView` enum + `domainAltPath`) represent the mapping. The proxy rewrites every custom-domain path into an optional catch-all `/d/[domain]/[[...slug]]` route, which resolves the mapping from the (already-cached) domain lookup and renders the matched `/u` page function or redirects unmapped paths to the main host.

**Tech Stack:** Next.js 16 App Router, Prisma 7 (pg adapter), next-intl, vitest.

**Spec:** `docs/superpowers/specs/2026-08-07-domain-path-mapping-design.md`

## Global Constraints

- **Never run npm scripts or installs from WSL.** All `npm run db:push` / `test` / `build` are USER CHECKPOINTS run in PowerShell. (Exception now allowed: `npx prisma generate/validate` is WASM-based in v7 and safe from WSL, but generated output should come from the Windows install to keep one source.)
- Prisma 7 idioms: import from `@/generated/prisma/client`, never `@prisma/client`; client modules must never import Prisma-touching libs (keep pure helpers separate — see lib/skills vs lib/skillsQuery).
- 4-space indent, `@/*` alias, conventional commits (multiple `-m`, no heredoc/`&&` in MY shell calls), bilingual i18n for all user-facing copy.
- Defaults must reproduce current behavior byte-identically (TIMELINE at `/`, résumé at `/resume`).

---

### Task 1: Schema — DomainView enum + mapping columns

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `User.domainRootView: DomainView` (default TIMELINE), `User.domainAltPath: string` (default "/resume"); enum `DomainView { TIMELINE RESUME }`.

- [ ] **Step 1: Add the enum and columns**

In `prisma/schema.prisma`, above `model User`, add:

```prisma
// Which public view a custom domain's root path serves. The other view lives
// at User.domainAltPath.
enum DomainView {
  TIMELINE
  RESUME
}
```

Inside `model User`, after the `customDomain` field:

```prisma
  // Custom-domain path mapping: the root view sits at "/", the other view at
  // domainAltPath. Defaults reproduce the original hardcoded behavior.
  domainRootView DomainView @default(TIMELINE)
  domainAltPath  String     @default("/resume")
```

- [ ] **Step 2: USER CHECKPOINT — `npm run db:push`** (PowerShell)

Expected: `Your database is now in sync` — enum + two defaulted columns, no data loss.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): DomainView enum + custom-domain path mapping columns"
```

---

### Task 2: Pure helpers `src/lib/domainPaths.ts` (TDD)

**Files:**
- Create: `src/lib/domainPaths.ts`
- Test: `src/lib/domainPaths.test.ts`

**Interfaces:**
- Produces (all pure; safe for client imports):
  - `type DomainPathConfig = { domainRootView: 'TIMELINE' | 'RESUME'; domainAltPath: string }`
  - `resolveDomainPaths(cfg: DomainPathConfig): { timelinePath: string; resumePath: string }`
  - `normalizeAltPath(input: string): { ok: true; path: string } | { ok: false; error: 'invalid_path' | 'reserved_path' }`
  - `RESERVED_PATH_SEGMENTS: ReadonlySet<string>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/domainPaths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveDomainPaths, normalizeAltPath } from './domainPaths';

describe('resolveDomainPaths', () => {
    it('root=TIMELINE puts timeline at / and resume at altPath', () => {
        expect(resolveDomainPaths({ domainRootView: 'TIMELINE', domainAltPath: '/resume' }))
            .toEqual({ timelinePath: '/', resumePath: '/resume' });
    });
    it('root=RESUME swaps them', () => {
        expect(resolveDomainPaths({ domainRootView: 'RESUME', domainAltPath: '/journey' }))
            .toEqual({ timelinePath: '/journey', resumePath: '/' });
    });
});

describe('normalizeAltPath', () => {
    it('normalizes casing, whitespace, and a missing leading slash', () => {
        expect(normalizeAltPath('  Resume ')).toEqual({ ok: true, path: '/resume' });
        expect(normalizeAltPath('/cv')).toEqual({ ok: true, path: '/cv' });
        expect(normalizeAltPath('my-journey')).toEqual({ ok: true, path: '/my-journey' });
    });
    it('rejects /, empty, multi-segment, and bad characters', () => {
        for (const bad of ['/', '', '/a/b', '/with space', '/中文', '/-leading-dash']) {
            expect(normalizeAltPath(bad)).toEqual({ ok: false, error: 'invalid_path' });
        }
    });
    it('rejects reserved segments but allows resume', () => {
        for (const r of ['/u', '/d', '/api', '/dashboard', '/setup', '/signin', '/signup', '/_next']) {
            expect(normalizeAltPath(r)).toEqual({ ok: false, error: 'reserved_path' });
        }
        expect(normalizeAltPath('/resume')).toEqual({ ok: true, path: '/resume' });
    });
});
```

- [ ] **Step 2: USER CHECKPOINT — verify fail** (`npx vitest run src/lib/domainPaths.test.ts` → cannot resolve module)

- [ ] **Step 3: Implement**

Create `src/lib/domainPaths.ts`:

```ts
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
```

- [ ] **Step 4: USER CHECKPOINT — verify pass** (5 tests green)
- [ ] **Step 5: Commit** — `feat(domain): path-mapping helpers with validation`

---

### Task 3: Broaden the cached domain lookup

**Files:**
- Modify: `src/lib/domainProfile.ts`
- Modify (callers): `src/app/d/[domain]/page.tsx`, `src/app/d/[domain]/resume/page.tsx` (both are deleted/replaced in Task 4 — this task just changes the lib; Task 4 consumes it)

**Interfaces:**
- Produces: `domainProfile(domain: string): Promise<{ username: string; timelinePath: string; resumePath: string } | null>` (React-cache'd). `usernameForDomain` is removed.

- [ ] **Step 1: Rewrite `src/lib/domainProfile.ts`**

```ts
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { resolveDomainPaths } from '@/lib/domainPaths';

// Resolves a bound custom domain to its owner's username plus the owner's
// path→view mapping. One cached DB hit per request shared by generateMetadata
// and the page body. Server-only (Prisma).
export const domainProfile = cache(async (domain: string) => {
    const user = await prisma.user.findUnique({
        where: { customDomain: domain.toLowerCase() },
        select: { username: true, domainRootView: true, domainAltPath: true },
    });
    if (!user?.username) return null;
    return { username: user.username, ...resolveDomainPaths(user) };
});
```

- [ ] **Step 2: Commit together with Task 4** (the old `/d` pages are the only callers; splitting the commit would break the build mid-way).

---

### Task 4: Catch-all route `/d/[domain]/[[...slug]]`

**Files:**
- Delete: `src/app/d/[domain]/page.tsx`, `src/app/d/[domain]/resume/page.tsx`
- Create: `src/app/d/[domain]/[[...slug]]/page.tsx`
- Keep: `src/app/d/[domain]/layout.tsx`, `src/app/d/[domain]/DomainNotBound.tsx` (unchanged)

**Interfaces:**
- Consumes: `domainProfile` (Task 3), `mainAppHost` from `@/lib/customDomain`, the `/u/[username]` and `/u/[username]/resume` page functions + metadata.
- Produces: every custom-domain path served or bounced from one route.

- [ ] **Step 1: Create the catch-all page**

`src/app/d/[domain]/[[...slug]]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { domainProfile } from '@/lib/domainProfile';
import { mainAppHost } from '@/lib/customDomain';
import PublicProfilePage, { generateMetadata as profileMetadata } from '@/app/u/[username]/page';
import PublicResumePage, { generateMetadata as resumeMetadata } from '@/app/u/[username]/resume/page';
import DomainNotBound from '../DomainNotBound';

interface Props {
    params: Promise<{ domain: string; slug?: string[] }>;
}

function pathFromSlug(slug: string[] | undefined): string {
    return `/${(slug ?? []).join('/')}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain, slug } = await params;
    const profile = await domainProfile(domain);
    if (!profile) return { title: 'Domain not bound' };
    const path = pathFromSlug(slug);
    const canonical = `https://${domain.toLowerCase()}${path === '/' ? '/' : path}`;
    if (path === profile.timelinePath) {
        const base = await profileMetadata({ params: Promise.resolve({ username: profile.username }) });
        return { ...base, alternates: { canonical } };
    }
    if (path === profile.resumePath) {
        const base = await resumeMetadata({ params: Promise.resolve({ username: profile.username }) });
        return { ...base, alternates: { canonical } };
    }
    return { title: 'Redirecting…' };
}

export default async function DomainCatchAllPage({ params }: Props) {
    const { domain, slug } = await params;
    const profile = await domainProfile(domain);
    if (!profile) return <DomainNotBound domain={domain.toLowerCase()} />;

    const path = pathFromSlug(slug);
    if (path === profile.timelinePath) {
        return PublicProfilePage({ params: Promise.resolve({ username: profile.username }) });
    }
    if (path === profile.resumePath) {
        return PublicResumePage({ params: Promise.resolve({ username: profile.username }) });
    }

    // Unmapped path: bounce to the main app, preserving the path. (Query
    // strings were already preserved by the proxy rewrite and are re-attached
    // by the client following the redirect target's location.)
    const appHost = mainAppHost();
    if (appHost) redirect(`https://${appHost}${path}`);
    return <DomainNotBound domain={domain.toLowerCase()} />;
}
```

- [ ] **Step 2: Delete the two old pages** (`git rm` both files).
- [ ] **Step 3: Commit Tasks 3+4** — `feat(domain): catch-all /d route resolves configurable path mapping`

---

### Task 5: Proxy — dumb full-path rewrite

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Replace the custom-domain branch body**

The branch keeps its guards (`x-forwarded-host`, internal-target skip,
`isMainHost`) and replaces the `/`-and-`/resume`-special-casing + bounce with
one rewrite:

```ts
    if (!isInternalTarget && !isMainHost(host)) {
        const bare = host.toLowerCase().split(':')[0];
        // Whole-path rewrite: the /d/[domain]/[[...slug]] route owns the
        // DB-backed decision of which paths render which view (or bounce).
        const rewritten = nextUrl.clone();
        rewritten.pathname = `/d/${bare}${nextUrl.pathname === '/' ? '' : nextUrl.pathname}`;
        return NextResponse.rewrite(rewritten);
    }
```

(The `NEXT_PUBLIC_APP_HOST` redirect arm disappears from the proxy — the
catch-all page bounces instead. `mainAppHost` import stays only if still used;
remove the unused import if not.)

- [ ] **Step 2: USER CHECKPOINT — dev verification** (dev server running, from WSL via Windows curl):

```bash
/mnt/c/Windows/System32/curl.exe -s -H "Host: ngkaizhe.com" http://localhost:3000/ | grep -o "黃開哲" | head -1        # timeline at /
/mnt/c/Windows/System32/curl.exe -s -H "Host: ngkaizhe.com" http://localhost:3000/resume | grep -c "履歷\|Résumé"     # resume at default alt
/mnt/c/Windows/System32/curl.exe -s -D - -o NUL -H "Host: ngkaizhe.com" http://localhost:3000/dashboard | grep -i location  # bounce via RSC redirect
```

- [ ] **Step 3: Commit** — `feat(proxy): rewrite all custom-domain paths into the /d catch-all`

---

### Task 6: `/u` canonicals follow the mapping

**Files:**
- Modify: `src/app/u/[username]/page.tsx` (generateMetadata)
- Modify: `src/app/u/[username]/resume/page.tsx` (generateMetadata)

- [ ] **Step 1:** In both `generateMetadata` selects, add `domainRootView: true, domainAltPath: true`. Import `resolveDomainPaths` from `@/lib/domainPaths`. Replace the hardcoded canonical values:

```ts
        ...(user.customDomain
            ? { alternates: { canonical: `https://${user.customDomain}${resolveDomainPaths(user).timelinePath === '/' ? '/' : resolveDomainPaths(user).timelinePath}` } }
            : {}),
```

Compute `const paths = resolveDomainPaths(user);` once and use
`paths.timelinePath` (profile page) / `paths.resumePath` (resume page);
render `'/'` as-is, other paths verbatim.

- [ ] **Step 2: Commit** — `feat(seo): canonicals follow the configured domain path mapping`

---

### Task 7: Settings UI — Paths card

**Files:**
- Modify: `src/app/dashboard/domain/actions.ts` (new action)
- Modify: `src/app/dashboard/domain/page.tsx` (pass mapping to client)
- Modify: `src/components/Domain/DomainSettings.tsx` (new card)
- Modify: `messages/en.json`, `messages/zh-TW.json`

**Interfaces:**
- Produces: server action `saveDomainPaths(rootView: 'TIMELINE' | 'RESUME', altPathInput: string): Promise<{ ok: boolean; error?: 'invalid_path' | 'reserved_path' }>`.

- [ ] **Step 1: Server action** (append to `src/app/dashboard/domain/actions.ts`):

```ts
export async function saveDomainPaths(
    rootView: 'TIMELINE' | 'RESUME',
    altPathInput: string,
): Promise<{ ok: boolean; error?: 'invalid_path' | 'reserved_path' }> {
    const userId = await getCurrentUserId();
    const normalized = normalizeAltPath(altPathInput);
    if (!normalized.ok) return { ok: false, error: normalized.error };
    await prisma.user.update({
        where: { id: userId },
        data: { domainRootView: rootView, domainAltPath: normalized.path },
    });
    revalidatePath('/dashboard/domain');
    return { ok: true };
}
```

(Import `normalizeAltPath` from `@/lib/domainPaths`.)

- [ ] **Step 2: Page** — in `src/app/dashboard/domain/page.tsx`, extend the user select with `domainRootView: true, domainAltPath: true` and pass `initialRootView` / `initialAltPath` props to `DomainSettings`.

- [ ] **Step 3: Client card** — in `DomainSettings.tsx`, below the status card, render (only when `domain` is bound):

```tsx
            {domain && (
                <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-medium text-text-secondary">{t('pathsTitle')}</h2>
                    <fieldset className="space-y-2">
                        <legend className="text-sm text-text-secondary">{t('homepageShows')}</legend>
                        {(['TIMELINE', 'RESUME'] as const).map(v => (
                            <label key={v} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                                <input
                                    type="radio"
                                    name="domain-root-view"
                                    checked={rootView === v}
                                    onChange={() => setRootView(v)}
                                    className="accent-blue-600"
                                />
                                {v === 'TIMELINE' ? t('viewTimeline') : t('viewResume')}
                            </label>
                        ))}
                    </fieldset>
                    <div>
                        <label htmlFor="domain-alt-path" className="block text-sm font-medium text-text-secondary mb-1">
                            {t('altPathLabel', { view: rootView === 'TIMELINE' ? t('viewResume') : t('viewTimeline') })}
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-text-muted">{domain}</span>
                            <input
                                id="domain-alt-path"
                                value={altPath}
                                onChange={(e) => setAltPath(e.target.value)}
                                placeholder="/resume"
                                className={`flex-1 ${inputClass}`}
                            />
                            <button
                                type="button"
                                onClick={onSavePaths}
                                disabled={pending}
                                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer"
                            >
                                {t('savePaths')}
                            </button>
                        </div>
                        {pathError && <p role="alert" className="mt-2 text-sm text-red-600">{pathError}</p>}
                        {pathSaved && <p className="mt-2 text-sm text-green-600">{t('pathsSaved')}</p>}
                    </div>
                </div>
            )}
```

State: `rootView`, `altPath` (from new props), `pathError: string | null`,
`pathSaved: boolean`. `onSavePaths` calls `saveDomainPaths`, maps error codes
through `t('error_invalid_path' | 'error_reserved_path')`, sets `pathSaved`
on success (clear it on next edit), and `router.refresh()`.

- [ ] **Step 4: i18n keys** — add to `DomainSettings` in both catalogs:

en: `"pathsTitle": "Paths"`, `"homepageShows": "Homepage shows"`,
`"viewTimeline": "Timeline"`, `"viewResume": "Résumé"`,
`"altPathLabel": "Path for {view}"`, `"savePaths": "Save paths"`,
`"pathsSaved": "Saved."`,
`"error_invalid_path": "Path must be a single lowercase segment like /resume."`,
`"error_reserved_path": "That path is reserved by the app."`

zh-TW: `"pathsTitle": "路徑"`, `"homepageShows": "首頁顯示"`,
`"viewTimeline": "時間軸"`, `"viewResume": "履歷"`,
`"altPathLabel": "{view}的路徑"`, `"savePaths": "儲存路徑"`,
`"pathsSaved": "已儲存。"`,
`"error_invalid_path": "路徑必須是單一段的小寫字串，例如 /resume。"`,
`"error_reserved_path": "此路徑為系統保留。"`

- [ ] **Step 5: Commit** — `feat(domain): path-mapping settings card`

---

### Task 8: Gate + deploy + live verification

- [ ] **Step 1: USER CHECKPOINT** (PowerShell): `npm run test` (expect 58: 53 + 5 new), `npm run build` (clean).
- [ ] **Step 2:** I run lint + tsc from WSL; merge branch → master → push → Vercel deploy.
- [ ] **Step 3: Production verification (curl + Playwright):**
  1. Defaults regression: `ngkaizhe.com/` timeline, `/resume` résumé, `/dashboard` bounce — unchanged.
  2. Via the settings UI (signed in through Playwright): set Homepage=Résumé + alt `/journey` → verify `ngkaizhe.com/` shows résumé heading, `/journey` shows timeline, `/resume` now bounces to main host.
  3. Invalid inputs (`/a/b`, `/dashboard`) show the two distinct inline errors.
  4. Reset to Homepage=Timeline + `/resume`; re-verify defaults.
- [ ] **Step 4:** Extend smoke-test skill T1.40 with a note that `/` and the alt path are user-configurable (assert against the CURRENT config or reset first). Update memory.
