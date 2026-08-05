# Custom Domain Mapping — Design Spec

Date: 2026-08-05
Status: Approved by user (pending spec review)

## Goal

Decouple the resume-builder product from `ngkaizhe.com`. The main app (landing, sign-in, dashboard) lives on the project's default Vercel URL (`<project>.vercel.app`). Any user can, from a settings page inside the app, bind a custom domain they own to their public profile: visiting that domain's root shows their public timeline preview, and `/resume` shows their public résumé. The binding is fully self-serve — the app registers the domain with the Vercel project via API and surfaces the DNS records and verification status to the user.

First real use case: `ngkaizhe.com` → `@ngkaizhe`.

## Non-goals (YAGNI)

- Multiple custom domains per user (one nullable unique field only).
- Automatic `www.` variant handling — the exact hostname the user enters is the one bound.
- Vercel for Platforms / multi-tenant wildcard architecture.
- Custom domains for anything other than the two public pages (timeline, résumé).

## 1. Data model

`prisma/schema.prisma` — add to `User`:

```prisma
customDomain String? @unique
```

Stored normalized: lowercase bare hostname, no scheme, no path, no trailing dot (e.g. `ngkaizhe.com`). Sync with `npm run db:push`.

## 2. Middleware host routing (`src/middleware.ts`)

Prepend a host check before existing logic. Main hosts are: the value of env `NEXT_PUBLIC_APP_HOST` (e.g. `my-personal-website.vercel.app`), any `*.vercel.app` host (covers preview deployments), `localhost`, and dev LAN IPs.

- Host is a main host → existing behavior unchanged (`/@x` rewrite, auth gate).
- Host is anything else (custom domain), pure string rewrites — **no DB access in middleware**:
  - `/` → rewrite to `/d/<host>`
  - `/resume` → rewrite to `/d/<host>/resume`
  - any other path → 307 redirect to `https://<NEXT_PUBLIC_APP_HOST><original path>`
- `matcher` unchanged; `/api/*` continues to bypass middleware and works on any host.

## 3. Public routes `src/app/d/[domain]/`

- `page.tsx`: `prisma.user.findUnique({ where: { customDomain: params.domain } })`.
  - Found → render the same timeline view as `/u/[username]` via `fetchTimelineByUserId` and the shared Timeline components. Extract a shared server component if needed rather than duplicating markup.
  - Not found → friendly "this domain is not bound to any profile" page with a link to the main site (not a 500).
- `resume/page.tsx`: same lookup, reuses the ResumeBuilder public view.
- SEO: `/d` pages set `metadata.alternates.canonical` to `https://<domain>/…`. Conversely `/u/[username]` (and its resume page) sets canonical to the custom domain when the user has one, so the two copies don't compete.

## 4. Settings page `/dashboard/domain`

New dashboard page (auth-gated like the rest), next-intl bilingual copy.

- **Bind form**: domain input → server action `setCustomDomain`:
  1. Normalize + validate (bare hostname regex; reject `*.vercel.app`, the main host, and IP literals).
  2. Write to DB first — the `@unique` constraint arbitrates races between users; constraint violation surfaces as "domain already taken".
  3. Call Vercel API to add the domain to the project. On API failure, roll back the DB write and surface the error.
  4. "Already added to this project" from Vercel is treated as success (idempotent — `ngkaizhe.com` is already attached).
- **Status panel**: shows the DNS records Vercel says to configure (A record for apex / CNAME for subdomain — display what the API returns, never hardcode IPs), plus verification state: `active` / `waiting for DNS` / `needs TXT verification` (with the TXT challenge when Vercel returns one). "Re-check" button → server action `checkDomainStatus`.
- **Unbind button** → server action `removeCustomDomain`: remove from Vercel project, then null the DB field.

## 5. Vercel API wrapper `src/lib/vercelDomains.ts`

Thin typed wrapper over four REST calls, authenticated with `VERCEL_TOKEN`:

| Purpose | Endpoint |
|---|---|
| Add domain to project | `POST /v10/projects/{VERCEL_PROJECT_ID}/domains` |
| Get domain + verification | `GET /v9/projects/{VERCEL_PROJECT_ID}/domains/{domain}` |
| Get DNS config status | `GET /v6/domains/{domain}/config` |
| Remove domain | `DELETE /v9/projects/{VERCEL_PROJECT_ID}/domains/{domain}` |

Error mapping: `domain_taken` (another Vercel account) → surface TXT verification flow; auth/config errors → generic failure message, DB rolled back.

New env vars (in `.env.local` and Vercel project settings): `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_APP_HOST`.

## 6. Ops checklist (manual, one-time)

1. Google Cloud Console → OAuth client → add redirect URI `https://<project>.vercel.app/api/auth/callback/google`.
2. Vercel project → set `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_APP_HOST` env vars.
3. Deploy. Sign in on the vercel.app URL, open `/dashboard/domain`, bind `ngkaizhe.com`. DNS needs no change (already points at Vercel); the domain stays attached to the same Vercel project throughout.

## 7. Error handling summary

| Case | Behavior |
|---|---|
| Invalid domain format | Inline form error |
| Domain taken by another user (DB unique) | Inline form error |
| Domain owned by another Vercel account | Status panel shows TXT verification record |
| Vercel API failure on bind | DB rolled back, error shown |
| Request arrives for unbound domain | `/d` renders "not bound" page |

## 8. Testing

- Unit: domain normalization/validation.
- Manual smoke: all existing main-host flows unchanged; after binding `ngkaizhe.com` — root shows timeline, `/resume` shows résumé, `/dashboard` redirects to main host. Extend the `smoke-test` skill with these checks afterwards.
