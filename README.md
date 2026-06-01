# My Journey — Personal Portfolio + Résumé Generator

A multi-user work log that becomes a résumé. Capture what you shipped, watch it compose itself into bullets, share it at your own vanity URL. Bilingual EN / 中文 throughout, AI-assisted authoring via Claude Haiku, three theme modes, and a print-ready résumé export.

Live at [ngkaizhe.com](https://ngkaizhe.com).

---

## Quick start (laptop → running site in 10 minutes)

This project develops on **Windows + WSL**, but the dev server runs on **Windows** (not WSL) because of native binary compatibility. If you're on macOS or Linux, you can collapse everything into one terminal.

### Prerequisites

- Node.js 24 LTS
- PostgreSQL (any provider — Neon free tier works, the seed is small)
- A Google OAuth Client (Console → APIs & Services → Credentials)
- An Anthropic API key (optional; the AI features degrade gracefully without it)

### Setup

```bash
git clone git@github.com:ngkaizhe/my-personal-website.git
cd my-personal-website
npm install              # ← from PowerShell on Windows, not WSL (see Gotchas)
cp .env.example .env.local   # create one and fill in the values below
```

Required env vars in `.env.local`:

```
DATABASE_URL="postgres://..."         # any Postgres
AUTH_SECRET="..."                     # `openssl rand -base64 32`
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ANTHROPIC_API_KEY="sk-ant-..."        # optional
BLOB_READ_WRITE_TOKEN="..."           # optional, for entry photo uploads
```

Push the schema + seed demo data:

```bash
npm run db:push
npm run db:seed
```

Run it:

```bash
npm run dev
# open http://localhost:3000
```

Click **Try as Demo** on the landing page to log in as the seeded demo user without any signup flow. That's the fastest way to see every feature with realistic data.

---

## What's in the box

| Surface | Path | What it does |
|---|---|---|
| Landing | `/` | Marketing page + sign-in (Google / Email / Demo) |
| Setup | `/setup` | First-time profile (username, display name, bio, avatar URL, contact links) |
| Dashboard | `/dashboard` | The owner's timeline view with search + skill filter |
| Quick Add | `/dashboard/quick-add` | One-sentence → AI parses into structured fields, then asks follow-up questions to fill gaps |
| Entries CRUD | `/dashboard/entries` | Manage detailed entries. Bilingual tabs (EN / 中文) per entry, image attachments via paste-or-upload |
| Experiences CRUD | `/dashboard/experiences` | Jobs / Education / Projects / Volunteer / Break — groups entries on the résumé |
| Skills | `/dashboard/skills` | Aggregated skill cloud, click a skill to filter the timeline |
| Resume Builder | `/dashboard/resume` | Filter by experience / date / featured-only, export as Markdown or print to PDF (3 templates) |
| Year Review | `/dashboard/year/[year]` | Annual stats + top tags + highlights |
| Public profile | `/@username` | Anyone can view (no auth). Shows timeline + contact icons |
| Public résumé | `/@username/resume` | Same builder, public data |
| Public skills | `/@username/skills` | Their skill cloud, click to filter their timeline |
| Public entry permalink | `/@username/entry/[id]` | One-entry-per-URL for social sharing |
| Public year review | `/@username/year/[year]` | Year stats shareable as URL |
| OG image | `/u/[username]/opengraph-image` | Auto-generated social card |

### Auth

Three providers all wire through NextAuth v5:

- **Google OAuth** — for real users
- **Email + bcrypt password** — for users who don't want Google
- **Demo** — zero-credential signin as the seeded `username='demo'` user, surfaced as a "Try as Demo" button on landing

The middleware enforces `/dashboard` and `/setup` require a signed-in session. It does NOT require a username to be set — the `UserMenu` surfaces "Set up your profile" when missing, and `/setup` is always reachable.

---

## Tech stack at a glance

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Server components, RSC, file-based routing |
| Language | TypeScript | strict mode, `@/*` alias to `src/*` |
| DB | PostgreSQL via Prisma 6 | type-safe queries, schema-first migrations |
| Auth | NextAuth v5 (Auth.js) | JWT session strategy, Prisma adapter |
| Styling | Tailwind CSS v4 | CSS-variable design tokens via `@theme` blocks |
| i18n | next-intl 4 | cookie-based locale, EN + 中文 |
| AI | Anthropic SDK + Claude Haiku 4.5 | parse-entry / translate / improve-bullet routes |
| Image upload | Vercel Blob | optional — photos can also be pasted as URLs |
| Markdown | react-markdown + remark-gfm | for description / impact / details rendering |
| Testing | Vitest + Playwright | unit tests in `src/**/*.test.ts`, smoke skill in `.claude/skills/` |
| CI | GitHub Actions | lint + tsc + i18n parity + unit tests on push/PR |
| Deploy | Vercel | Fluid Compute / Node.js runtime for middleware |

---

## Repository layout

```
prisma/
  schema.prisma            ← DB schema, source of truth
  seed.ts                  ← demo data
messages/
  en.json / zh-TW.json     ← every UI string. Parity-checked in CI
src/
  app/
    page.tsx               ← landing
    layout.tsx             ← root layout, locale + theme + SessionProvider wiring
    dashboard/             ← auth-gated owner views
    setup/                 ← first-time profile
    signin/, signup/       ← email auth pages
    u/[username]/          ← public profile + résumé + permalinks + OG image
    api/                   ← API routes (parse-entry, translate-content, improve-bullet, upload-image)
  auth.ts                  ← NextAuth instance + adapter
  auth.config.ts           ← providers + callbacks (shared with middleware)
  middleware.ts            ← /@user rewrite + auth gate. Pinned to nodejs runtime
  components/              ← UI components, grouped by domain (Entry/, Timeline/, Resume/, …)
  lib/                     ← pure helpers (translations, skills, rateLimit, yearReview, …)
  i18n/request.ts          ← next-intl request config
.claude/
  skills/smoke-test/       ← post-refactor functional smoke test, see "Testing" below
.github/workflows/ci.yml   ← lint / tsc / parity / unit tests
```

### Where to look for X

- "Where does this DB query happen?" → `src/lib/timeline.ts`, `src/lib/resume.ts`, or the per-route `actions.ts`
- "Where's the form for this entity?" → `src/components/{Entry,Experience}/<X>Form.tsx`
- "How does locale routing work?" → cookie `locale`, read in `src/i18n/request.ts`, surfaced via `useTranslations()` / `getTranslations()`
- "Where do the icons live?" → Lucide via `src/lib/iconNames.ts` (auto-generated allowlist)
- "What CSS tokens exist?" → `src/app/globals.css` `@theme` block

---

## Key concepts a junior should understand

### 1. Bilingual content is a parent + translations table

Every `Entry` and `Experience` has a parent row holding language-neutral fields (date, color, icon, techStack, links, featured flag) and a sibling translation row per locale holding the text fields (title, actionVerb, description, …).

When reading: `pickTranslation(translations, locale, primaryLocale)` picks the right one with fallback. When writing: form posts `field_en` + `field_zh-TW` and the action splits them. **Don't add another text field directly to `Entry`** — put it on `EntryTranslation`. See `src/lib/translations.ts` and `prisma/schema.prisma`.

### 2. Three themes via CSS variables, not Tailwind `dark:` prefix

`light`, `dark`, `sepia` each override the same `--color-*` variables in `globals.css` under a class selector on `<html>`. Tailwind utilities like `bg-surface` and `text-text-primary` map to these via Tailwind v4's `@theme` block. To add a fourth theme: add a class block, add it to `THEME_OPTIONS` in `ThemeProvider.tsx`, done.

### 3. Cookie-based locale, no URL prefix

Locale lives in a `locale` cookie. The root layout reads it server-side, stamps `<html lang>`, and wraps the tree in `NextIntlClientProvider`. The `LocaleToggle` flips the cookie + `router.refresh()`. No `/en/...` or `/zh/...` in URLs.

### 4. AI features degrade when ANTHROPIC_API_KEY is missing

`isAiParseAvailable()` is the env-aware gate. When false: nav hides Quick Add, the Quick Add page renders a "feature unavailable" card with a link to manual entry, Translate buttons disappear from the form, Improve buttons disappear from the résumé. Don't crash, don't show broken UI.

### 5. Middleware is on nodejs runtime, not edge

The Credentials provider pushes the bundle over Vercel's 1MB edge limit, so `src/middleware.ts` declares `runtime: 'nodejs'`. Don't remove this. The trade-off is ~50ms cold start instead of ~5ms, which is fine.

### 6. Session callback re-reads username from DB every call

The JWT signed at sign-in time doesn't refresh when /setup updates the user. So `auth.config.ts`'s `session()` callback does a Prisma lookup on every call to keep `session.user.username` fresh. One DB query per request — fine at our scale, and it removes a whole class of "stale JWT" bugs.

---

## Common dev tasks

| Task | Command / file |
|---|---|
| Run dev server | `npm run dev` (Windows PowerShell, not WSL) |
| Apply schema change (non-destructive) | `npm run db:push` |
| Apply schema change (drop everything) | `npm run db:reset` |
| Re-seed demo data | `npm run db:seed` |
| Open Prisma Studio | `npm run db:studio` |
| Add a UI string | Add to both `messages/en.json` and `messages/zh-TW.json`. CI fails if keys don't match. |
| Add a Tailwind colour token | Add to `@theme` block in `globals.css`. Mirror it in `.dark` and `.sepia` overrides. |
| Run unit tests | `npm test` (or `npm run test:watch`) |
| Run linter | `npm run lint` |
| Run the smoke-test skill | In Claude Code, say "run smoke-test" or "verify the app". See `.claude/skills/smoke-test/SKILL.md` |

---

## Deployment

Deploys to Vercel on push to `master` via auto-detected GitHub integration.

### Env vars set in Vercel Production

Same as local `.env.local` except:

- `AUTH_URL=https://ngkaizhe.com` (NextAuth needs the canonical URL)
- `AUTH_TRUST_HOST=true` (so NextAuth trusts the Vercel `x-forwarded-host`)
- `BLOB_READ_WRITE_TOKEN` is auto-injected when you connect a Vercel Blob store

### Custom domain

`ngkaizhe.com` lives on Cloudflare Registrar. DNS records (CNAME `@` and `www`, both pointing at `cname.vercel-dns.com`, both "DNS only" gray-cloud) tell browsers to talk to Vercel directly. Cloudflare only does DNS resolution — Vercel handles SSL, CDN, everything else. **Don't turn the orange cloud on** — Cloudflare's SSL fights with Vercel's.

### Google OAuth callback URIs

Must include both the Vercel preview URL and the production domain:

- `https://ngkaizhe.com/api/auth/callback/google`
- `https://www.ngkaizhe.com/api/auth/callback/google`
- `https://<project>.vercel.app/api/auth/callback/google`

Same three URLs as Authorized JavaScript origins (without the callback path).

---

## Testing

Three layers:

1. **Unit tests** — `vitest`, lives next to source as `*.test.ts`. Covers pure functions (translations, skills, rateLimit). Runs in CI.
2. **Smoke-test skill** — `.claude/skills/smoke-test/SKILL.md`. A checklist of ~38 functional checks for routes / auth gate / locale toggles / AI endpoints / OG image / etc. Triggered manually from Claude Code with "smoke test" or "verify nothing broke" after architecture changes.
3. **Production checks** — none automated yet. The smoke-test skill can be pointed at the production URL.

The skill is intentionally a living document — when you add a feature, update the skill's checklist so the next refactor has something to verify against.

---

## Gotchas

### Windows + WSL development

The repo is on `/mnt/c/...` (Windows filesystem). The dev server runs on **Windows PowerShell**, not WSL. Reasons:

1. `npm install` on WSL installs Linux native binaries (`lightningcss.linux-x64`) into nested `node_modules`, which a later Windows `npm install` won't overwrite. The Windows dev server then can't find its expected `lightningcss.win32-x64-msvc.node`. **Never run `npm install` from WSL** — if you've broken it, the only fix is `Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json; npm install` from PowerShell.
2. Playwright MCP runs in WSL but the dev server is on Windows — use `localhost:3000` directly thanks to WSL2 Mirrored Networking (configured in user's `.wslconfig`).

### Framer Motion is effectively banned

Motion 12 + Next 16 + React 19 has a bug where mount animations (`whileInView`, initial→animate, `AnimatePresence`) don't fire reliably. We replaced all uses with CSS keyframes in `globals.css`. Don't reintroduce `motion.div` for mount-time animation — it'll silently break. Animations triggered by state change (like `TagInput`) still work.

### Tailwind v4 doesn't read colours from config

Tailwind v4 only reads colours declared in the `@theme` block inside `globals.css`. **Don't put colours in `tailwind.config.js`** — they'll silently be ignored.

### Satori (next/og) is stricter than browser CSS

The OG image generator at `/u/<user>/opengraph-image` uses next/og's satori renderer. Rules:

- Every parent of multiple children must have `display: flex`
- No `em` / `rem` units, only `px`
- Linear gradients can trip on prod even when local renders fine
- Use explicit `marginRight` / `marginBottom` instead of `gap`

The first prod deploy 500'd on this exact issue.

### Markdown rendering is XSS-conservative

`MarkdownText` deliberately doesn't enable `rehype-raw`. Raw HTML in user entries would be a stored-XSS hole on the public `/@username` pages. If you need a new markdown feature, prefer adding a `remarkPlugin` over allowing HTML.

---

## License

Personal project. No license declared — treat it as all rights reserved.
