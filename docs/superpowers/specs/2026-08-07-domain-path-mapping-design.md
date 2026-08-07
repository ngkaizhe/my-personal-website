# Custom Domain Path → View Mapping — Design Spec

Date: 2026-08-07
Status: Approved approach (A); spec pending user review

## Goal

On a bound custom domain, the owner chooses which of the two readonly public
views lives at which path. Today the mapping is hardcoded (`/` → timeline,
`/resume` → résumé); after this change the owner configures it from
`/dashboard/domain`. Example: `ngkaizhe.com/` shows the résumé and
`ngkaizhe.com/journey` shows the timeline.

## Requirements (settled in brainstorming)

1. Two views exist: **timeline** and **résumé**. Each has a configurable path.
2. **Exactly one of the two paths must be `/`** — a visitor opening the bare
   domain always sees content, never a bounce.
3. Owner-edit affordance is unchanged: the signed-in owner still sees Edit
   buttons on their own custom domain; visitors never do.
4. Paths not mapped to either view keep today's behavior: 307 to the main app
   host with the path preserved.
5. Defaults reproduce current behavior exactly (timeline at `/`, résumé at
   `/resume`), so existing bound domains change nothing on deploy.

## Non-goals (YAGNI)

- More than one path per view; more view types; per-path metadata.
- 301 redirects from previously-configured paths after a change (the old path
  simply becomes unmapped and bounces).
- Making the proxy read the DB.

## 1. Data model

The "one path must be `/`" rule lets two columns represent the whole mapping
losslessly:

```prisma
enum DomainView {
  TIMELINE
  RESUME
}

model User {
  // ...existing fields...
  // Which view the custom domain's root path shows.
  domainRootView DomainView @default(TIMELINE)
  // Where the other view lives (single segment, leading slash).
  domainAltPath  String     @default("/resume")
}
```

Interpretation: `domainRootView`'s view is at `/`; the *other* view is at
`domainAltPath`. Helper `resolveDomainPaths(user)` returns
`{ timelinePath, resumePath }` so consumers never re-derive the rule.

## 2. Proxy change (`src/proxy.ts`)

The custom-domain branch stops special-casing `/` and `/resume` and stops
bouncing unmapped paths itself. For a non-main host it rewrites **every**
matched path to the catch-all:

```
/<anything>  →  rewrite  /d/<host>/<anything>
```

(`/` rewrites to `/d/<host>`.) The existing guards stay: `x-forwarded-host`
preferred, `/u/` and `/d/` internal targets skipped, matcher unchanged
(`/api`, `_next` never reach the proxy). The proxy remains DB-free; the
mapping decision moves into the `/d` route. Main-host behavior (auth gate,
`/@` rewrite) is untouched.

## 3. Route restructure: `/d/[domain]/[[...slug]]`

Replace `src/app/d/[domain]/page.tsx` + `resume/page.tsx` with one optional
catch-all route:

- Normalize `slug` to a path string: `undefined` → `/`, `['journey']` →
  `/journey`. Multi-segment slugs are never mapped (alt path is single
  segment) and fall through to the bounce.
- Look up the user by `customDomain` (existing cached `usernameForDomain`
  broadened to also return the two mapping columns, still one cached query
  per request).
- Domain unbound → existing `DomainNotBound` page (unchanged).
- Path == timelinePath → render the existing `/u/[username]` page function.
- Path == resumePath → render the existing `/u/[username]/resume` page
  function.
- Anything else → `redirect('https://<NEXT_PUBLIC_APP_HOST><path>')` (307 via
  RSC redirect; replaces the bounce the proxy used to issue).
- `generateMetadata` branches the same way; canonical = custom domain + the
  matched path. `/u/[username]` and `/u/[username]/resume` canonicals also
  switch from hardcoded `/` and `/resume` to the resolved paths.

## 4. Settings UI (`/dashboard/domain`)

A "Paths" card appears under the existing status card once a domain is bound:

- Radio group **"Homepage shows"**: Timeline / Résumé (maps to
  `domainRootView`).
- Text input **"Path for the other view"** (maps to `domainAltPath`), shown
  with the domain as a prefix (`ngkaizhe.com` + `/resume`).
- Save button → server action `saveDomainPaths(rootView, altPath)`.
- Bilingual copy via next-intl, shared `formStyles` classes.

Validation (server-side, mirrored client-side for instant feedback):

- `altPath` matches `^/[a-z0-9][a-z0-9-]*$` (single segment, lowercase).
- `altPath` is not `/` (that slot belongs to the root view).
- `altPath`'s segment is not in the reserved set
  `{u, d, api, dashboard, setup, signin, signup, _next}`. (`resume` is
  deliberately NOT reserved — it is the default alt path.)
- Errors return the existing `DomainActionResult`-style union
  (`invalid_path` | `reserved_path`) rendered as inline `role="alert"` text.

## 5. Error handling summary

| Case | Behavior |
|---|---|
| Bad altPath format / reserved | Inline form error, nothing saved |
| Visitor hits unmapped path on bound domain | 307 to main host, path preserved |
| Visitor hits any path on unbound domain pointing at us | DomainNotBound page |
| Multi-segment path equals nothing | Bounce (same as unmapped) |

## 6. Testing

- Unit (vitest): `resolveDomainPaths` (both root choices), altPath validator
  (format, reserved set, `/` rejection). Pure helpers in `lib/domainPaths.ts`.
- Manual/prod smoke additions (extend T1.40): after setting root=RESUME,
  `curl domain/` contains résumé heading; timeline reachable at its alt path;
  the old path bounces. Reset to defaults afterwards.
- Regression: default-valued user (ngkaizhe.com) behaves byte-identically to
  today on `/`, `/resume`, `/dashboard`.

## 7. Migration / rollout

- `npm run db:push` adds the enum + two defaulted columns (no data loss, no
  backfill needed — defaults reproduce current behavior).
- Deploy order safe in either direction: old code ignores the new columns;
  new code's defaults match old behavior.

## Amendment (2026-08-07, post-launch user feedback)

The settings UI was reworked: instead of a "homepage shows" radio + a single
alt-path input (which hid the "root at /, other at altPath" rule), the card
now shows **both views as directly editable path rows** (timeline + résumé,
each prefixed with the domain) and one Save button. The "exactly one path is
/" invariant moved from UI construction into save-time validation
(`normalizeViewPaths`, new error `need_root`). The storage model
(`domainRootView` + `domainAltPath`) is unchanged.
