# Custom Domain Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users bind their own domain (e.g. `ngkaizhe.com`) to their public profile from a dashboard settings page; the domain's root serves their timeline, `/resume` serves their résumé, everything else redirects to the main app on `<project>.vercel.app`.

**Architecture:** Middleware does pure host-string rewrites (no DB) to new `/d/[domain]` routes, which look up `User.customDomain` and delegate to the existing `/u/[username]` page components. A settings page calls a thin Vercel Domains API wrapper via server actions; DB unique constraint arbitrates domain ownership.

**Tech Stack:** Next.js 16 App Router, Prisma (PostgreSQL), NextAuth v5, next-intl, vitest, Vercel Domains REST API.

**Spec:** `docs/superpowers/specs/2026-08-05-custom-domain-design.md`

## Global Constraints

- **Never run `npm install` or any npm script from WSL** (native binaries are Windows-only). All `npm run test` / `npm run build` / dev-server verification is executed by the user in PowerShell; the implementer writes code, commits, and asks the user to run verification commands at the checkpoints marked below.
- Schema sync uses `npm run db:push` (PowerShell, user-run) — never `prisma migrate dev`.
- Commit style: conventional commits, one commit per task, multiple `-m` flags (no heredoc, no `&&` chaining, separate Bash calls for `git add` / `git commit`).
- All user-facing copy goes through next-intl: add keys to BOTH `messages/en.json` and `messages/zh-TW.json`.
- Follow existing file conventions: 4-space indent in `src/`, `@/*` path alias, server actions in `actions.ts` next to their page.
- Do NOT use Framer Motion for any new UI (CSS keyframes only, per CLAUDE.md).
- New env vars: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, optional `VERCEL_TEAM_ID`, `NEXT_PUBLIC_APP_HOST`. Never commit real values; `.env.example` gets placeholders.

---

### Task 1: Schema — `User.customDomain`

**Files:**
- Modify: `prisma/schema.prisma` (User model, after `website String?`)
- Modify: `.env.example` (document new env vars)

**Interfaces:**
- Produces: `User.customDomain: string | null` (unique), used by Tasks 3, 5, 6.

- [ ] **Step 1: Add the field**

In `prisma/schema.prisma`, inside `model User`, after the `website  String?` line add:

```prisma
  // Bare hostname (e.g. "ngkaizhe.com") the user bound to their public
  // profile. Root of that domain serves their timeline, /resume their résumé.
  customDomain  String?      @unique
```

- [ ] **Step 2: Document env vars**

In `.env.example`, append:

```bash
# --- Custom domain feature ---
# Vercel API token (Account Settings -> Tokens) used to attach user domains to this project.
VERCEL_TOKEN="your-vercel-api-token"
# Project ID from Vercel project settings (prj_...).
VERCEL_PROJECT_ID="prj_xxxxxxxxxxxx"
# Only needed if the project lives under a team scope.
# VERCEL_TEAM_ID="team_xxxxxxxxxxxx"
# Host of the main app (no scheme). Custom domains redirect non-public paths here.
NEXT_PUBLIC_APP_HOST="my-personal-website.vercel.app"
```

- [ ] **Step 3: USER CHECKPOINT — sync schema**

Ask the user to run in PowerShell: `npm run db:push`
Expected output contains: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma .env.example
git commit -m "feat(schema): add User.customDomain for custom domain mapping" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Domain helpers `src/lib/customDomain.ts` (TDD)

**Files:**
- Create: `src/lib/customDomain.ts`
- Test: `src/lib/customDomain.test.ts`

**Interfaces:**
- Produces:
  - `normalizeDomain(input: string): string | null` — returns normalized bare hostname or null if invalid/forbidden.
  - `isMainHost(host: string): boolean` — true when the request Host belongs to the main app (Task 3 middleware and Task 6 validation both use this).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/customDomain.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { normalizeDomain, isMainHost } from './customDomain';

describe('normalizeDomain', () => {
    it('lowercases and trims', () => {
        expect(normalizeDomain('  NgKaiZhe.Com ')).toBe('ngkaizhe.com');
    });
    it('strips scheme, path, query, port and trailing dot', () => {
        expect(normalizeDomain('https://ngkaizhe.com/resume?x=1')).toBe('ngkaizhe.com');
        expect(normalizeDomain('ngkaizhe.com:443')).toBe('ngkaizhe.com');
        expect(normalizeDomain('ngkaizhe.com.')).toBe('ngkaizhe.com');
    });
    it('accepts subdomains', () => {
        expect(normalizeDomain('me.example.co.uk')).toBe('me.example.co.uk');
    });
    it('rejects garbage, bare TLDs and IPs', () => {
        expect(normalizeDomain('')).toBeNull();
        expect(normalizeDomain('not a domain')).toBeNull();
        expect(normalizeDomain('localhost')).toBeNull();
        expect(normalizeDomain('192.168.1.1')).toBeNull();
    });
    it('rejects vercel.app and the main host', () => {
        expect(normalizeDomain('foo.vercel.app')).toBeNull();
        expect(normalizeDomain('my-personal-website.vercel.app')).toBeNull();
    });
});

describe('isMainHost', () => {
    const OLD = process.env.NEXT_PUBLIC_APP_HOST;
    beforeEach(() => { process.env.NEXT_PUBLIC_APP_HOST = 'my-personal-website.vercel.app'; });
    afterEach(() => { process.env.NEXT_PUBLIC_APP_HOST = OLD; });

    it('accepts the configured app host, vercel.app previews, localhost and IPs', () => {
        expect(isMainHost('my-personal-website.vercel.app')).toBe(true);
        expect(isMainHost('my-personal-website-git-x-user.vercel.app')).toBe(true);
        expect(isMainHost('localhost:3000')).toBe(true);
        expect(isMainHost('172.30.192.1:3000')).toBe(true);
        expect(isMainHost('')).toBe(true); // missing Host header: never treat as custom domain
    });
    it('rejects custom domains', () => {
        expect(isMainHost('ngkaizhe.com')).toBe(false);
        expect(isMainHost('www.ngkaizhe.com')).toBe(false);
    });
});
```

- [ ] **Step 2: USER CHECKPOINT — verify tests fail**

Ask the user to run in PowerShell: `npx vitest run src/lib/customDomain.test.ts`
Expected: FAIL — cannot resolve `./customDomain`.

- [ ] **Step 3: Implement**

Create `src/lib/customDomain.ts`:

```ts
// Pure string helpers for the custom-domain feature. Imported by middleware,
// so this file must stay free of Prisma / Node-only dependencies.

// RFC-1123-ish hostname with at least one dot and an alphabetic TLD.
const HOSTNAME_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

function bareHost(host: string): string {
    return host.trim().toLowerCase().split(':')[0];
}

function appHost(): string | null {
    const raw = process.env.NEXT_PUBLIC_APP_HOST;
    return raw ? bareHost(raw) : null;
}

/**
 * Normalize user input ("HTTPS://Foo.com/bar") to a bare hostname ("foo.com").
 * Returns null when the input is not a bindable domain: malformed, an IP,
 * a *.vercel.app host, or the main app host itself.
 */
export function normalizeDomain(input: string): string | null {
    let s = input.trim().toLowerCase();
    if (!s) return null;
    s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
    s = s.split('/')[0].split('?')[0].split('#')[0]; // path / query / fragment
    s = s.split(':')[0]; // port
    s = s.replace(/\.$/, ''); // trailing dot
    if (!HOSTNAME_RE.test(s)) return null;
    if (IP_RE.test(s)) return null;
    if (s.endsWith('.vercel.app')) return null;
    if (s === appHost()) return null;
    return s;
}

/**
 * Is this request Host one of the main app's hosts (as opposed to a bound
 * custom domain)? Fail-open: anything unrecognizable counts as main so the
 * app never redirect-loops on misconfiguration.
 */
export function isMainHost(host: string): boolean {
    const bare = bareHost(host);
    if (!bare) return true;
    if (bare === 'localhost' || IP_RE.test(bare)) return true;
    if (bare.endsWith('.vercel.app')) return true;
    if (bare === appHost()) return true;
    // Only hosts that could actually be bound count as custom domains.
    return !HOSTNAME_RE.test(bare);
}
```

- [ ] **Step 4: USER CHECKPOINT — verify tests pass**

Ask the user to run in PowerShell: `npx vitest run src/lib/customDomain.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/customDomain.ts src/lib/customDomain.test.ts
git commit -m "feat(domain): add domain normalization and main-host helpers" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Middleware host routing

**Files:**
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `isMainHost` from Task 2.
- Produces: requests on custom domains reach `/d/<host>` and `/d/<host>/resume` (Task 4's routes); all other custom-domain paths 307 to `https://${NEXT_PUBLIC_APP_HOST}<path>`.

- [ ] **Step 1: Insert host branch**

In `src/middleware.ts`, add the import and insert the block at the very top of the `auth((req) => { ... })` callback, before the existing `/@` rewrite:

```ts
import { isMainHost } from '@/lib/customDomain';
```

```ts
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
```

- [ ] **Step 2: USER CHECKPOINT — dev verification**

`/d` routes don't exist yet, so only verify the redirect arm. Ask the user to start the dev server (PowerShell `npm run dev`), then from WSL:

Run: `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" -H "Host: fake-domain.test" http://localhost:3000/dashboard`
Expected: `307 https://my-personal-website.vercel.app/dashboard` (with `NEXT_PUBLIC_APP_HOST=my-personal-website.vercel.app` in `.env.local`; add it now with the real project host).

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard`
Expected: `307` only if signed out (redirect to `/`) — i.e. existing behavior on localhost unchanged, no cross-host redirect.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(middleware): route custom-domain hosts to /d pages, bounce the rest" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Public routes `/d/[domain]`

**Files:**
- Create: `src/app/d/[domain]/layout.tsx`
- Create: `src/app/d/[domain]/page.tsx`
- Create: `src/app/d/[domain]/resume/page.tsx`
- Create: `src/app/d/[domain]/DomainNotBound.tsx`
- Modify: `messages/en.json`, `messages/zh-TW.json` (add `DomainNotBound` section)

**Interfaces:**
- Consumes: `User.customDomain` (Task 1); existing `/u/[username]` page components.
- Produces: rendered public pages for any bound host; friendly fallback for unbound hosts.

- [ ] **Step 1: Layout — reuse the public profile chrome**

Create `src/app/d/[domain]/layout.tsx`:

```tsx
// Same header/chrome as the /u/[username] public pages.
export { default } from '@/app/u/[username]/layout';
```

- [ ] **Step 2: Not-bound fallback component**

Create `src/app/d/[domain]/DomainNotBound.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function DomainNotBound({ domain }: { domain: string }) {
    const t = await getTranslations('DomainNotBound');
    const appHost = process.env.NEXT_PUBLIC_APP_HOST;
    return (
        <div className="bg-page min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-4">
                <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
                <p className="text-text-secondary">{t('description', { domain })}</p>
                {appHost && (
                    <a
                        href={`https://${appHost}`}
                        className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                        {t('cta')}
                    </a>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 3: Timeline page**

Create `src/app/d/[domain]/page.tsx` — resolves the domain then delegates to the existing `/u` page component (server components are plain async functions, so calling them directly is legal and keeps one source of truth):

```tsx
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PublicProfilePage, { generateMetadata as profileMetadata } from '@/app/u/[username]/page';
import DomainNotBound from './DomainNotBound';

interface Props {
    params: Promise<{ domain: string }>;
}

async function usernameFor(domain: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { customDomain: domain.toLowerCase() },
        select: { username: true },
    });
    return user?.username ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain } = await params;
    const username = await usernameFor(domain);
    if (!username) return { title: 'Domain not bound' };
    const base = await profileMetadata({ params: Promise.resolve({ username }) });
    return { ...base, alternates: { canonical: `https://${domain.toLowerCase()}/` } };
}

export default async function DomainHomePage({ params }: Props) {
    const { domain } = await params;
    const username = await usernameFor(domain);
    if (!username) return <DomainNotBound domain={domain.toLowerCase()} />;
    return PublicProfilePage({ params: Promise.resolve({ username }) });
}
```

- [ ] **Step 4: Résumé page**

Create `src/app/d/[domain]/resume/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PublicResumePage, { generateMetadata as resumeMetadata } from '@/app/u/[username]/resume/page';
import DomainNotBound from '../DomainNotBound';

interface Props {
    params: Promise<{ domain: string }>;
}

async function usernameFor(domain: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { customDomain: domain.toLowerCase() },
        select: { username: true },
    });
    return user?.username ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { domain } = await params;
    const username = await usernameFor(domain);
    if (!username) return { title: 'Domain not bound' };
    const base = await resumeMetadata({ params: Promise.resolve({ username }) });
    return { ...base, alternates: { canonical: `https://${domain.toLowerCase()}/resume` } };
}

export default async function DomainResumePage({ params }: Props) {
    const { domain } = await params;
    const username = await usernameFor(domain);
    if (!username) return <DomainNotBound domain={domain.toLowerCase()} />;
    return PublicResumePage({ params: Promise.resolve({ username }) });
}
```

- [ ] **Step 5: i18n keys**

`messages/en.json` — add top-level section:

```json
"DomainNotBound": {
    "title": "This domain isn't bound yet",
    "description": "{domain} points at our platform but no profile has claimed it.",
    "cta": "Go to the main site"
}
```

`messages/zh-TW.json`:

```json
"DomainNotBound": {
    "title": "此網域尚未綁定",
    "description": "{domain} 已指向本平台，但還沒有任何個人檔案綁定它。",
    "cta": "前往主站"
}
```

- [ ] **Step 6: USER CHECKPOINT — dev verification**

Bind the real domain in DB first (safe: middleware only acts on Host headers), from WSL:

```bash
docker run --rm postgres:16-alpine psql "$DATABASE_URL" -c "UPDATE \"User\" SET \"customDomain\"='ngkaizhe.com' WHERE email='kaizhe30@gmail.com';"
```

Then with the dev server running:

Run: `curl -s -H "Host: ngkaizhe.com" http://localhost:3000/ | grep -o "黃開哲" | head -1`
Expected: `黃開哲` (timeline renders).

Run: `curl -s -H "Host: ngkaizhe.com" http://localhost:3000/resume | grep -c "resume\|履歷"`
Expected: non-zero.

Run: `curl -s -H "Host: unbound.example" http://localhost:3000/ | grep -c "isn't bound\|尚未綁定"`
Expected: non-zero (fallback page).

- [ ] **Step 7: Commit**

```bash
git add src/app/d messages/en.json messages/zh-TW.json
git commit -m "feat(domain): public /d/[domain] routes reusing /u page components" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Vercel Domains API wrapper (TDD)

**Files:**
- Create: `src/lib/vercelDomains.ts`
- Test: `src/lib/vercelDomains.test.ts`

**Interfaces:**
- Produces (consumed by Task 6 server actions):
  - `addDomainToProject(domain: string): Promise<{ ok: boolean; errorCode?: string }>`
  - `getDomainStatus(domain: string): Promise<DomainStatus>`
  - `removeDomainFromProject(domain: string): Promise<{ ok: boolean }>`
  - `type DomainStatus = { state: 'active' | 'pending_dns' | 'needs_verification' | 'not_found' | 'error'; dnsRecords: { type: 'A' | 'CNAME'; name: string; value: string }[]; verification: { type: string; domain: string; value: string }[] }`

- [ ] **Step 1: Write the failing tests (mocked fetch)**

Create `src/lib/vercelDomains.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addDomainToProject, getDomainStatus, removeDomainFromProject } from './vercelDomains';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(status: number, body: unknown) {
    return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

beforeEach(() => {
    fetchMock.mockReset();
    process.env.VERCEL_TOKEN = 'tok';
    process.env.VERCEL_PROJECT_ID = 'prj_1';
    delete process.env.VERCEL_TEAM_ID;
});

describe('addDomainToProject', () => {
    it('succeeds on 200', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { name: 'a.com' }));
        expect(await addDomainToProject('a.com')).toEqual({ ok: true });
    });
    it('treats already-added-to-this-project as success', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse(409, { error: { code: 'domain_already_in_use_by_your_projects' } }),
        );
        expect((await addDomainToProject('a.com')).ok).toBe(true);
    });
    it('surfaces other error codes', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: { code: 'forbidden' } }));
        expect(await addDomainToProject('a.com')).toEqual({ ok: false, errorCode: 'forbidden' });
    });
});

describe('getDomainStatus', () => {
    it('active when verified and configured', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, { verified: true }))
            .mockResolvedValueOnce(jsonResponse(200, { misconfigured: false }));
        const s = await getDomainStatus('a.com');
        expect(s.state).toBe('active');
    });
    it('pending_dns when misconfigured, with apex A record', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, { verified: true }))
            .mockResolvedValueOnce(jsonResponse(200, { misconfigured: true, recommendedIPv4: ['76.76.21.21'] }));
        const s = await getDomainStatus('a.com');
        expect(s.state).toBe('pending_dns');
        expect(s.dnsRecords).toEqual([{ type: 'A', name: '@', value: '76.76.21.21' }]);
    });
    it('needs_verification exposes TXT challenge, subdomain gets CNAME', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, {
                verified: false,
                verification: [{ type: 'TXT', domain: '_vercel.me.a.com', value: 'vc-domain-verify=xyz' }],
            }))
            .mockResolvedValueOnce(jsonResponse(200, { misconfigured: true }));
        const s = await getDomainStatus('me.a.com');
        expect(s.state).toBe('needs_verification');
        expect(s.verification[0].value).toBe('vc-domain-verify=xyz');
        expect(s.dnsRecords[0]).toEqual({ type: 'CNAME', name: 'me', value: 'cname.vercel-dns.com' });
    });
    it('not_found on 404', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(404, { error: { code: 'not_found' } }))
            .mockResolvedValueOnce(jsonResponse(404, { error: { code: 'not_found' } }));
        expect((await getDomainStatus('a.com')).state).toBe('not_found');
    });
});

describe('removeDomainFromProject', () => {
    it('ok on 200 and on 404 (already gone)', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
        expect((await removeDomainFromProject('a.com')).ok).toBe(true);
        fetchMock.mockResolvedValueOnce(jsonResponse(404, {}));
        expect((await removeDomainFromProject('a.com')).ok).toBe(true);
    });
});
```

- [ ] **Step 2: USER CHECKPOINT — verify tests fail**

PowerShell: `npx vitest run src/lib/vercelDomains.test.ts`
Expected: FAIL — cannot resolve `./vercelDomains`.

- [ ] **Step 3: Implement**

Create `src/lib/vercelDomains.ts`:

```ts
// Thin wrapper around the Vercel Domains REST API. Server-side only.
// Docs: https://vercel.com/docs/rest-api/endpoints/projects

const API = 'https://api.vercel.com';

// Fallbacks when the config endpoint doesn't return recommended records.
const FALLBACK_APEX_A = '76.76.21.21';
const FALLBACK_CNAME = 'cname.vercel-dns.com';

export type DomainStatus = {
    state: 'active' | 'pending_dns' | 'needs_verification' | 'not_found' | 'error';
    dnsRecords: { type: 'A' | 'CNAME'; name: string; value: string }[];
    verification: { type: string; domain: string; value: string }[];
};

function headers(): Record<string, string> {
    return { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` };
}

function teamQs(): string {
    return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
}

function projectBase(): string {
    return `${API}/v10/projects/${process.env.VERCEL_PROJECT_ID}`;
}

export async function addDomainToProject(domain: string): Promise<{ ok: boolean; errorCode?: string }> {
    const res = await fetch(`${projectBase()}/domains${teamQs()}`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    const code: string = body?.error?.code ?? `http_${res.status}`;
    // Domain already on this project (e.g. ngkaizhe.com attached manually
    // before this feature shipped) — the end state is what we wanted.
    if (code.startsWith('domain_already_in_use_by_your')) return { ok: true };
    return { ok: false, errorCode: code };
}

export async function getDomainStatus(domain: string): Promise<DomainStatus> {
    const [projRes, cfgRes] = await Promise.all([
        fetch(`${projectBase()}/domains/${domain}${teamQs()}`, { headers: headers(), cache: 'no-store' }),
        fetch(`${API}/v6/domains/${domain}/config${teamQs()}`, { headers: headers(), cache: 'no-store' }),
    ]);
    if (projRes.status === 404) return { state: 'not_found', dnsRecords: [], verification: [] };
    if (!projRes.ok) return { state: 'error', dnsRecords: [], verification: [] };

    const proj = await projRes.json();
    const cfg = cfgRes.ok ? await cfgRes.json() : { misconfigured: true };

    // Apex domains (example.com) need an A record; subdomains a CNAME.
    const labels = domain.split('.');
    const isApex = labels.length === 2;
    const dnsRecords: DomainStatus['dnsRecords'] = isApex
        ? [{ type: 'A', name: '@', value: cfg.recommendedIPv4?.[0] ?? FALLBACK_APEX_A }]
        : [{ type: 'CNAME', name: labels[0], value: cfg.recommendedCNAME?.[0] ?? FALLBACK_CNAME }];

    const verification = (proj.verification ?? []).map(
        (v: { type: string; domain: string; value: string }) => ({
            type: v.type, domain: v.domain, value: v.value,
        }),
    );

    const state: DomainStatus['state'] = !proj.verified
        ? 'needs_verification'
        : cfg.misconfigured
            ? 'pending_dns'
            : 'active';
    return { state, dnsRecords, verification };
}

export async function removeDomainFromProject(domain: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${projectBase()}/domains/${domain}${teamQs()}`, {
        method: 'DELETE',
        headers: headers(),
    });
    // 404 = already detached; that's the state we want.
    return { ok: res.ok || res.status === 404 };
}
```

- [ ] **Step 4: USER CHECKPOINT — verify tests pass**

PowerShell: `npx vitest run src/lib/vercelDomains.test.ts`
Expected: all tests PASS. Also run the full suite: `npm run test` — everything green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/vercelDomains.ts src/lib/vercelDomains.test.ts
git commit -m "feat(domain): Vercel Domains API wrapper with idempotent add/remove" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Settings page `/dashboard/domain`

**Files:**
- Create: `src/app/dashboard/domain/actions.ts`
- Create: `src/app/dashboard/domain/page.tsx`
- Create: `src/components/Domain/DomainSettings.tsx`
- Modify: `src/app/dashboard/layout.tsx` (nav link)
- Modify: `messages/en.json`, `messages/zh-TW.json` (`Nav.domain` + `DomainSettings` section)

**Interfaces:**
- Consumes: `normalizeDomain` (Task 2); `addDomainToProject` / `getDomainStatus` / `removeDomainFromProject` / `DomainStatus` (Task 5); `getCurrentUserId` from `@/lib/currentUser`.
- Produces: server actions `setCustomDomain(domain: string)`, `checkDomainStatus()`, `removeCustomDomain()` — all return `{ ok: boolean; error?: 'invalid' | 'taken' | 'vercel_failed'; status?: DomainStatus }`.

- [ ] **Step 1: Server actions**

Create `src/app/dashboard/domain/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { normalizeDomain } from '@/lib/customDomain';
import {
    addDomainToProject,
    getDomainStatus,
    removeDomainFromProject,
    type DomainStatus,
} from '@/lib/vercelDomains';

export type DomainActionResult = {
    ok: boolean;
    error?: 'invalid' | 'taken' | 'vercel_failed';
    status?: DomainStatus;
};

export async function setCustomDomain(domainInput: string): Promise<DomainActionResult> {
    const userId = await getCurrentUserId();
    const domain = normalizeDomain(domainInput);
    if (!domain) return { ok: false, error: 'invalid' };

    const prev = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });

    // DB first: the unique constraint arbitrates races between users.
    try {
        await prisma.user.update({ where: { id: userId }, data: { customDomain: domain } });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return { ok: false, error: 'taken' };
        }
        throw e;
    }

    const added = await addDomainToProject(domain);
    if (!added.ok) {
        // Roll back so DB never claims a domain Vercel doesn't know about.
        await prisma.user.update({
            where: { id: userId },
            data: { customDomain: prev?.customDomain ?? null },
        });
        return { ok: false, error: 'vercel_failed' };
    }

    revalidatePath('/dashboard/domain');
    return { ok: true, status: await getDomainStatus(domain) };
}

export async function checkDomainStatus(): Promise<DomainActionResult> {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });
    if (!user?.customDomain) return { ok: false };
    return { ok: true, status: await getDomainStatus(user.customDomain) };
}

export async function removeCustomDomain(): Promise<DomainActionResult> {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });
    if (!user?.customDomain) return { ok: true };

    const removed = await removeDomainFromProject(user.customDomain);
    if (!removed.ok) return { ok: false, error: 'vercel_failed' };

    await prisma.user.update({ where: { id: userId }, data: { customDomain: null } });
    revalidatePath('/dashboard/domain');
    return { ok: true };
}
```

- [ ] **Step 2: Page (server component)**

Create `src/app/dashboard/domain/page.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/currentUser';
import { getDomainStatus, type DomainStatus } from '@/lib/vercelDomains';
import DomainSettings from '@/components/Domain/DomainSettings';

export async function generateMetadata() {
    const t = await getTranslations('DomainSettings');
    return { title: t('title') };
}

export default async function DomainPage() {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customDomain: true },
    });
    const domain = user?.customDomain ?? null;
    let status: DomainStatus | null = null;
    if (domain) {
        status = await getDomainStatus(domain);
    }
    const t = await getTranslations('DomainSettings');

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('title')}</h1>
                <p className="text-text-muted mt-1">{t('subtitle')}</p>
            </div>
            <DomainSettings initialDomain={domain} initialStatus={status} />
        </div>
    );
}
```

- [ ] **Step 3: Client component**

Create `src/components/Domain/DomainSettings.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import type { DomainStatus } from '@/lib/vercelDomains';
import {
    setCustomDomain,
    checkDomainStatus,
    removeCustomDomain,
    type DomainActionResult,
} from '@/app/dashboard/domain/actions';

interface Props {
    initialDomain: string | null;
    initialStatus: DomainStatus | null;
}

export default function DomainSettings({ initialDomain, initialStatus }: Props) {
    const t = useTranslations('DomainSettings');
    const router = useRouter();
    const [input, setInput] = useState(initialDomain ?? '');
    const [domain, setDomain] = useState(initialDomain);
    const [status, setStatus] = useState(initialStatus);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const applyResult = (r: DomainActionResult, boundDomain: string | null) => {
        if (r.ok) {
            setDomain(boundDomain);
            setStatus(r.status ?? null);
            setError(null);
            router.refresh();
        } else if (r.error) {
            setError(t(`error_${r.error}`));
        }
    };

    const onBind = () => startTransition(async () => {
        const r = await setCustomDomain(input);
        applyResult(r, r.ok ? input.trim().toLowerCase() : domain);
    });
    const onRecheck = () => startTransition(async () => {
        const r = await checkDomainStatus();
        if (r.ok) { setStatus(r.status ?? null); setError(null); }
    });
    const onRemove = () => startTransition(async () => {
        const r = await removeCustomDomain();
        if (r.ok) { setDomain(null); setStatus(null); setInput(''); setError(null); router.refresh(); }
        else if (r.error) setError(t(`error_${r.error}`));
    });

    const stateMeta: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
        active: { icon: <CheckCircle2 className="w-4 h-4" />, label: t('stateActive'), cls: 'text-green-600' },
        pending_dns: { icon: <Clock className="w-4 h-4" />, label: t('statePendingDns'), cls: 'text-amber-600' },
        needs_verification: { icon: <ShieldAlert className="w-4 h-4" />, label: t('stateNeedsVerification'), cls: 'text-amber-600' },
        not_found: { icon: <ShieldAlert className="w-4 h-4" />, label: t('stateNotFound'), cls: 'text-red-600' },
        error: { icon: <ShieldAlert className="w-4 h-4" />, label: t('stateError'), cls: 'text-red-600' },
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                <label htmlFor="custom-domain" className="block text-sm font-medium text-text-secondary">
                    {t('inputLabel')}
                </label>
                <div className="flex gap-2">
                    <input
                        id="custom-domain"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="yourname.com"
                        className="flex-1 px-4 py-3 rounded-xl bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={onBind}
                        disabled={pending || !input.trim()}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                    >
                        {domain ? t('rebind') : t('bind')}
                    </button>
                </div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <p className="text-xs text-text-muted">{t('hint')}</p>
            </div>

            {domain && status && (
                <div className="bg-surface border border-border-light rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center gap-2 text-sm font-medium ${stateMeta[status.state].cls}`}>
                            {stateMeta[status.state].icon}
                            <span>{domain}</span>
                            <span>·</span>
                            <span>{stateMeta[status.state].label}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onRecheck}
                                disabled={pending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-light text-sm text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> {t('recheck')}
                            </button>
                            <button
                                type="button"
                                onClick={onRemove}
                                disabled={pending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> {t('remove')}
                            </button>
                        </div>
                    </div>

                    {status.state !== 'active' && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary">{t('dnsInstructions')}</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-text-muted">
                                        <tr><th className="py-1 pr-4">Type</th><th className="py-1 pr-4">Name</th><th className="py-1">Value</th></tr>
                                    </thead>
                                    <tbody className="font-mono text-text-primary">
                                        {status.dnsRecords.map((r) => (
                                            <tr key={`${r.type}-${r.name}`}>
                                                <td className="py-1 pr-4">{r.type}</td>
                                                <td className="py-1 pr-4">{r.name}</td>
                                                <td className="py-1 break-all">{r.value}</td>
                                            </tr>
                                        ))}
                                        {status.verification.map((v) => (
                                            <tr key={v.value}>
                                                <td className="py-1 pr-4">{v.type}</td>
                                                <td className="py-1 pr-4 break-all">{v.domain}</td>
                                                <td className="py-1 break-all">{v.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Nav link**

In `src/app/dashboard/layout.tsx`, after the `Resume` NavLink add:

```tsx
<NavLink href="/dashboard/domain">{tNav('domain')}</NavLink>
```

- [ ] **Step 5: i18n keys**

`messages/en.json` — in `"Nav"` add `"domain": "Domain"`; add top-level:

```json
"DomainSettings": {
    "title": "Custom Domain",
    "subtitle": "Point a domain you own at your public profile.",
    "inputLabel": "Domain",
    "bind": "Bind",
    "rebind": "Change",
    "remove": "Remove",
    "recheck": "Re-check",
    "hint": "Enter a bare domain like yourname.com. Its homepage will show your timeline, /resume your résumé.",
    "stateActive": "Active",
    "statePendingDns": "Waiting for DNS",
    "stateNeedsVerification": "Needs TXT verification",
    "stateNotFound": "Not attached",
    "stateError": "Status unavailable",
    "dnsInstructions": "Add these records at your DNS provider, then re-check:",
    "error_invalid": "That doesn't look like a valid domain.",
    "error_taken": "This domain is already bound to another profile.",
    "error_vercel_failed": "Couldn't register the domain with the platform. Try again later."
}
```

`messages/zh-TW.json` — in `"Nav"` add `"domain": "網域"`; add:

```json
"DomainSettings": {
    "title": "自訂網域",
    "subtitle": "把你擁有的網域指向你的公開檔案。",
    "inputLabel": "網域",
    "bind": "綁定",
    "rebind": "更換",
    "remove": "移除",
    "recheck": "重新檢查",
    "hint": "輸入裸網域，例如 yourname.com。該網域首頁會顯示你的時間軸，/resume 顯示公開履歷。",
    "stateActive": "已生效",
    "statePendingDns": "等待 DNS 生效",
    "stateNeedsVerification": "需要 TXT 驗證",
    "stateNotFound": "尚未掛載",
    "stateError": "無法取得狀態",
    "dnsInstructions": "到你的 DNS 服務商新增以下記錄，然後重新檢查：",
    "error_invalid": "這看起來不是有效的網域。",
    "error_taken": "此網域已被其他使用者綁定。",
    "error_vercel_failed": "無法向平台註冊此網域，請稍後再試。"
}
```

- [ ] **Step 6: USER CHECKPOINT — dev verification**

User adds to `.env.local`: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (from Vercel dashboard). Restart dev server, sign in, open `http://localhost:3000/dashboard/domain`:

- Page shows the already-bound `ngkaizhe.com` (from Task 4's DB update) with status (likely Active).
- Enter `foo.vercel.app` → inline "not a valid domain" error.
- "Re-check" refreshes status without errors.
- Do NOT click Remove (it would detach the live domain).

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/domain src/components/Domain src/app/dashboard/layout.tsx messages/en.json messages/zh-TW.json
git commit -m "feat(domain): self-serve custom domain settings page with Vercel API binding" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Canonical URLs on `/u` pages

**Files:**
- Modify: `src/app/u/[username]/page.tsx` (generateMetadata)
- Modify: `src/app/u/[username]/resume/page.tsx` (generateMetadata)

**Interfaces:**
- Consumes: `User.customDomain` (Task 1).

- [ ] **Step 1: Timeline page metadata**

In `src/app/u/[username]/page.tsx` `generateMetadata`, add `customDomain: true` to the `select`, and extend the returned object:

```ts
    return {
        title: display,
        description: user.bio || `${display}'s journey timeline.`,
        ...(user.customDomain
            ? { alternates: { canonical: `https://${user.customDomain}/` } }
            : {}),
        openGraph: {
            title: display,
            description: user.bio || `${display}'s journey timeline.`,
            type: 'profile',
        },
    };
```

- [ ] **Step 2: Résumé page metadata**

Same change in `src/app/u/[username]/resume/page.tsx` `generateMetadata` — add `customDomain: true` to the select and:

```ts
    return {
        title: `${display} — Résumé`,
        ...(user.customDomain
            ? { alternates: { canonical: `https://${user.customDomain}/resume` } }
            : {}),
    };
```

- [ ] **Step 3: USER CHECKPOINT — verify**

With dev server running, from WSL:

Run: `curl -s http://localhost:3000/@ngkaizhe | grep -o 'rel="canonical"[^>]*'`
Expected: contains `https://ngkaizhe.com/`.

- [ ] **Step 4: Commit**

```bash
git add src/app/u
git commit -m "feat(seo): canonical URLs point at the bound custom domain" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Build gate + deploy + production cutover

**Files:** none (verification/ops)

- [ ] **Step 1: USER CHECKPOINT — full local gate**

PowerShell: `npm run test` → all green. `npm run lint` → clean. `npm run build` → succeeds.

- [ ] **Step 2: Ops (user, one-time)**

1. Google Cloud Console → OAuth client → add redirect URI `https://<project>.vercel.app/api/auth/callback/google`.
2. Vercel project → Environment Variables → add `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_APP_HOST` (production).
3. Push / deploy.

- [ ] **Step 3: Production smoke**

- `https://<project>.vercel.app` → landing / sign-in works (Google OAuth via new redirect URI).
- `https://ngkaizhe.com` → 黃開哲 timeline. `https://ngkaizhe.com/resume` → résumé.
- `https://ngkaizhe.com/dashboard` → 307 to `https://<project>.vercel.app/dashboard`.
- Sign in on main host → `/dashboard/domain` shows ngkaizhe.com Active.

- [ ] **Step 4: Extend smoke-test skill**

Add the three production checks above to the project's `smoke-test` skill checklist file, commit as `chore(skill): smoke-test covers custom domain routing`.
