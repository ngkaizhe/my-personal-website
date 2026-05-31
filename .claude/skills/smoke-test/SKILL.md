---
name: smoke-test
description: Run a comprehensive post-refactor functional smoke test of this Next.js portfolio + résumé project. Verifies routing, auth gate, public profile, dashboard CRUD, theme + locale toggles, i18n message integrity, Quick Add graceful degrade, and console error freshness. Use after any non-trivial change ("did I break anything?", "verify the app still works", "regression check", "smoke test", "post-refactor verification", "確認沒改壞"). Reports pass/fail per check; does NOT auto-fix — it surfaces regressions for the user to review.
---

# Smoke Test — Post-Refactor Functional Verification

This skill walks you through a deterministic checklist of the project's golden paths. Run it after any change that could plausibly affect routing, server actions, the auth flow, theming, i18n, or the inline-create-experience modal. Each check has a precise success criterion so you can produce a pass/fail report instead of vibe-based "looks fine".

## Operating principles

- **Read-mostly.** This skill verifies; it does not refactor. If a check fails, surface it to the user with the exact symptom + diff hint — let them decide whether to fix.
- **Idempotent.** Tier 1 + Tier 2-read checks leave no DB residue. Tier 2-write checks add then remove rows; if you create state you can't clean up, declare it in the report.
- **Stop on infrastructure failure.** If the dev server isn't reachable or Prisma can't connect, halt and ask the user — don't try to run app-level checks blind.
- **Report shape.** End with a structured summary: `[N] passed · [M] failed · [K] skipped`, then per-tier breakdown with one line per failing check including the diagnostic.

## When to invoke

| Trigger | Use this skill? |
|---|---|
| "Verify the app", "smoke test", "regression check", "did I break X" | **Yes** |
| After non-trivial commits touching `src/app/**`, `src/components/**`, `prisma/**`, `messages/**`, `middleware.ts`, `next.config.js` | **Yes** |
| After updating dependencies (especially next, next-auth, next-intl, prisma) | **Yes** |
| User asks to add a feature — verify *before* and *after* | **Yes, both** |
| Trivial style tweak (e.g. one className change) | Skip — TaskCreate a follow-up if uncertain |
| Adding a new translation key | Verify the i18n parity check at minimum |

## Pre-flight

Run these in order. **Abort the skill if any fails** — they're prerequisites, not test cases.

### P1. Dev server reachable

```bash
curl -sI -o /dev/null -w "%{http_code}\n" --max-time 5 http://localhost:3000/
```

Expect `200`. If `000` or non-200, ask the user to start the dev server (`npm run dev` from Windows PowerShell — never WSL, per CLAUDE.md) and pause.

### P2. Database reachable

```bash
npx dotenv -e .env.local -- node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{console.log('users:'+c);return p.\$disconnect();})"
```

Expect `users:N` with N ≥ 1. If 0, run `npm run db:seed` (after asking the user) — the demo user is required for public-profile checks. If connection error, halt and surface.

### P3. Playwright browser ready

Confirm chrome-for-testing is installed:

```bash
ls ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null | head -1
```

If missing: `npx @playwright/mcp install-browser chrome-for-testing` (one-shot, ~150MB download).

### P4. Mirrored networking active (WSL-only sanity)

If on WSL, `localhost:3000` from the Playwright MCP must reach the Windows dev server. The `.wslconfig` should have `networkingMode=mirrored`. Quick check: `curl localhost:3000` succeeded in P1, so we already verified this implicitly.

## Tier 1 — Auth-free, deterministic

These run against the dev server with no session cookie. Every check should be runnable on a fresh checkout assuming pre-flight passed.

For each check below: navigate via `mcp__playwright__browser_navigate`, snapshot or evaluate via `mcp__playwright__browser_evaluate`, compare to the expected outcome. Record pass/fail with the actual value.

### T1.1 — Landing page renders

- URL: `http://localhost:3000/`
- Expect:
  - `<h1>` text matches the localised landing title (en: "Track. Reflect. Resume." / zh-TW: "記錄。回顧。產出履歷。")
  - A `<button type="submit">` with the "Sign in with Google" / "使用 Google 登入" text exists
  - A link to `/@demo` exists
  - Console: 0 errors

### T1.2 — Public profile renders (`/@demo`)

- URL: `http://localhost:3000/@demo`
- Expect:
  - URL stays on `/@demo` (middleware rewrites internally to `/u/demo`; verify with `page.url()`)
  - `<h1>` contains the demo user's displayName ("Demo Person")
  - At least 1 timeline card (`role="button"` with `aria-label` starting with "View details for" / "查看")
  - Console: 0 errors

### T1.3 — Public résumé renders (`/@demo/resume`)

- URL: `http://localhost:3000/@demo/resume`
- Expect:
  - `<h1>` contains "— Résumé" or "— 履歷"
  - At least one section heading among: Experience / Education / Projects / Volunteer / Other (or zh-TW equivalents)
  - The `Markdown` textarea is non-empty
  - Console: 0 errors

### T1.4 — 404 for unknown username

- URL: `http://localhost:3000/@nonexistent_user_smoke_test_zzz`
- Expect:
  - HTTP 404 (check via curl: `curl -sI -o /dev/null -w "%{http_code}" .../@nonexistent...`)
  - Page renders the not-found heading ("No one's here yet." / "這裡還沒有人。")
  - Link to `/` and to `/@demo` present

### T1.5 — Auth gate redirects

Verify the middleware sends unauthenticated users away from protected routes.

```bash
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" --max-time 5 http://localhost:3000/dashboard
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" --max-time 5 http://localhost:3000/setup
```

- Expect both to return a 3xx pointing at `/` (or `/?callbackUrl=...`).

### T1.6 — Theme toggle works

In Playwright (no auth cookie needed — toggle is in `/u/[username]` layout):

1. Navigate to `/@demo`
2. Find the theme button (`aria-label` starts with "Change theme" / "切換主題")
3. Read `document.documentElement.className` — record initial theme
4. Click theme button → menu opens
5. Click a different theme option
6. Re-read `document.documentElement.className` — should contain the new theme class (`light` / `dark` / `sepia`)
7. Confirm cookie set: `document.cookie` contains `theme=<new-value>`
8. Reload the page (`page.reload()`)
9. After reload, `document.documentElement.className` should still contain the new theme class (verifies server-side cookie read in root layout)
10. Reset to `light` to leave the dev session predictable for the next check

### T1.7 — Locale toggle works

1. Navigate to `/@demo`
2. Read initial `<html lang>`
3. Find locale button (`aria-label` starts with "Change language" / "切換語言")
4. Click it
5. Confirm `<html lang>` flipped (`en` ↔ `zh-TW`)
6. Confirm visible nav text reflects the new locale (e.g. landing page nav shows "Track. Reflect. Resume." vs "記錄。回顧。產出履歷。")
7. Confirm cookie: `document.cookie` contains `locale=<new-value>`
8. Reload — locale should persist
9. Restore to `en` before finishing

### T1.8 — Theme + locale combined cookie persistence

Set `theme=dark; locale=zh-TW` via `document.cookie`, reload, verify `<html class>` contains `dark` AND `<html lang>` is `zh-TW`. This catches regressions in `src/app/layout.tsx` where one of the two cookie reads might get lost.

### T1.9 — i18n key parity

```bash
node -e "
const en = require('./messages/en.json');
const zh = require('./messages/zh-TW.json');
function keys(obj, prefix='') {
  return Object.entries(obj).flatMap(([k,v]) =>
    typeof v === 'object' && v !== null ? keys(v, prefix+k+'.') : [prefix+k]
  );
}
const enKeys = new Set(keys(en));
const zhKeys = new Set(keys(zh));
const onlyEn = [...enKeys].filter(k => !zhKeys.has(k));
const onlyZh = [...zhKeys].filter(k => !enKeys.has(k));
if (onlyEn.length || onlyZh.length) {
  console.error('MISMATCH');
  if (onlyEn.length) console.error('  EN-only:', onlyEn);
  if (onlyZh.length) console.error('  ZH-only:', onlyZh);
  process.exit(1);
}
console.log('OK', enKeys.size, 'keys match');
"
```

- Expect: `OK <N> keys match`. Any output containing `MISMATCH` is a regression (a t() call will render the raw key path in one language).

### T1.10 — Lint passes

```bash
npm run lint
```

- Expect exit code 0. Surface any new warnings introduced by the current branch — `git diff --stat HEAD~1 -- 'src/**/*.tsx'` to scope.

### T1.11 — Prisma client + schema in sync

```bash
npx dotenv -e .env.local -- npx prisma validate
```

- Expect: `The schema at prisma/schema.prisma is valid`.

### T1.14 — Bilingual content swaps with locale (read path)

Verifies the EntryTranslation / ExperienceTranslation fan-out actually wires through to the public profile. Uses the seed demo user.

1. Set cookie `locale=en` and navigate to `/@demo` → capture the first card's text.
2. Set cookie `locale=zh-TW`, reload `/@demo` → capture the first card's text.
3. Assert the two captures differ AND the EN one contains an English token from the seed (e.g. "Graduated") AND the ZH one contains a Chinese token (e.g. "取得" or "州立大學").

Catches: missed `getLocale()` plumbing in a query helper, broken `pickTranslation` fallback, or a forgotten `translations: true` include.

### T1.15 — tagSlug crosses locales

In the demo data, the "Engineering" entry's tag becomes "工程" in 中文. They must share a slug so resume sectioning + badge colour stay consistent.

```bash
npx dotenv -e .env.local -- node -e "
const{PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const e = await p.entry.findFirst({
    where: { tagSlug: 'engineering' },
    include: { translations: true },
  });
  if (!e) { console.error('no entry with tagSlug=engineering'); process.exit(1); }
  const en = e.translations.find(t => t.locale === 'en')?.tag;
  const zh = e.translations.find(t => t.locale === 'zh-TW')?.tag;
  console.log(JSON.stringify({ slug: e.tagSlug, en, zh }));
  await p.\$disconnect();
})();
"
```

- Expect: `slug` is a lowercase-kebab string AND `en` !== `zh` (different display labels) AND both are non-empty.

### T1.17 — Email signup + sign-in (Credentials provider)

Verifies the email + password auth path works end-to-end without OAuth.

1. From a clean cookie jar, navigate to `/signup`.
2. Fill `input[name="email"]` with `smoke-${Date.now()}@local.test` (unique each run so retries don't collide) and `input[name="password"]` with `demo-password-123`.
3. Click the submit button via Playwright's `.click()` (NOT raw `document.querySelector(...).click()` — the latter can bypass React's onSubmit on the SetupForm later).
4. Assert URL settles on `/setup`.
5. Fill `input[id="setup-username"]` with a unique slug (e.g. `smoke${Date.now()}`).
6. Click "Save and continue" via `.click()`.
7. Assert URL settles on `/dashboard` AND the nav contains "Timeline" / "Entries" / "Experiences" / "Resume" links.

Catches regressions in: Credentials authorize() callback, bcrypt hashing, the `signUpWithEmail` server action's auto-signin, and the middleware "no-username" gate (which was deliberately removed because `useSession().update()` doesn't survive Credentials sessions — see commit history).

Cleanup: leave the created User row. They're cheap and don't interfere with other checks.

### T1.18 — Sign-in form rejects bad credentials

```bash
# Use curl with -c/-b to manage cookies; verify a wrong password doesn't grant a session
# This is hard to test purely via shell because of CSRF tokens. Easier in Playwright:
```

In Playwright:
1. Navigate to `/signin`
2. Fill email = `smoke-test@local.test`, password = `wrong-password`
3. Submit → assert URL stays on `/signin` AND `[role="alert"]` contains an error message
4. Verify document.cookie does NOT contain `authjs.session-token`

### T1.19 — Featured-only filter reduces résumé bullets

The seed marks 6 of 8 demo entries as `featured=true`. Without filter: 8 bullets; with featured-only on: 6.

1. Navigate to `/@demo/resume`
2. Count `section li` elements → record N1
3. Check the "Featured only" checkbox (`label:has-text("Featured only") input[type="checkbox"]`)
4. Count `section li` again → record N2
5. Assert N2 < N1 AND N2 > 0

### T1.20 — Print stylesheet hides chrome

1. Navigate to `/@demo/resume`
2. `await page.emulateMedia({ media: 'print' })`
3. Assert: `nav` has `display: none`, every `.resume-print-hide` has `display: none`, every `.no-print` has `display: none`
4. Restore: `await page.emulateMedia({ media: 'screen' })`

Catches regressions in `globals.css` print rules or anyone accidentally removing the `.resume-print-hide` / `.no-print` classes from ResumeBuilder / resume pages.

### T1.21 — Try-as-Demo button signs in as the seeded demo user

1. Clear cookies, navigate to `/`.
2. Find the "Try as Demo (no signup)" / "用 Demo 帳號試試" button (server action submit button).
3. Click via Playwright's `.click()`.
4. Assert URL settles on `/dashboard` AND nav contains all 5 links AND `<h1>` text equals "MY JOURNEY".

Catches: the `demo` Credentials provider missing or broken, the seed `demo` username changing, or the landing page accidentally losing the demo CTA.

### T1.22 — Timeline search filters cards live + `/` shortcut focuses input

1. With a session that has ≥ 1 entry (demo works), navigate to `/dashboard` (or `/@demo` for an unauth check).
2. Count cards via `[role="button"][aria-label^="View details"]` → record N1.
3. Press `/` via `page.keyboard.press('/')`.
4. Assert `document.activeElement.type === 'search'`.
5. Type a token that appears in only one seed entry (e.g. "Docker" matches the CI/CD entry).
6. Count cards again → record N2.
7. Assert N2 < N1 AND N2 > 0.

Catches regressions in the `useEffect` keyboard listener, the haystack composition, or the empty-state fallback.

### T1.23 — Quick Add Q&A: sparse input triggers follow-up questions

Requires `ANTHROPIC_API_KEY` (this is a Tier-1 check but skip with reason if absent).

1. Sign in as demo (or any auth'd user).
2. Navigate to `/dashboard/quick-add`.
3. Fill `#quick-input` with deliberately sparse text: "Today I shipped a feature".
4. Click "Parse with AI".
5. Wait for `input[name="title"]` to appear AND for at least 1 element with `id^="qa-followup-"` to be present (the model should ask follow-ups because the input is intentionally thin).
6. Fill at least one of the follow-up textareas with a concrete answer.
7. Click "Apply answers".
8. Wait for the refinement round-trip to complete (button no longer shows "Refining…").
9. Assert one of the parsed form fields updated to reflect the answer (e.g. the `description` textarea no longer matches the original sparse model output).

Catches: the questions array missing in the response, the refinement turn parameter not propagating, or the form not re-rendering on state update.

### T1.24 — Markdown rendering in EntryCard doesn't crash on plain text or markdown

Smoke test for the MarkdownText component. Any successful dashboard / public profile / entry detail page load already exercises this (every TimelineModal opens an EntryCard). If the dashboard or `/@demo` returns 200 + h1 renders, this passes. No separate Playwright step needed unless you want to verify markdown formatting renders:

1. Create or pick a test entry whose description contains `**bold text**` and `[a link](https://example.com)`.
2. Navigate to that entry's timeline modal.
3. Assert the rendered description contains a `<strong>` element AND an `<a>` element pointing at `https://example.com`.

(Optional — skip if no markdown-flavoured test entry is available.)

### T1.25 — Print template selector + variants apply

1. Navigate to `/dashboard/resume` or `/@demo/resume`.
2. Find `select#print-template` — assert it has options `minimal`, `classic`, `compact`.
3. Select `classic` → assert `document.body.dataset.printTemplate === 'classic'`.
4. Emulate print media: `await page.emulateMedia({ media: 'print' })`.
5. Assert the body computed font-family contains "Georgia" / "serif".
6. Restore: select `minimal` → confirm body font-family is back to the default sans-serif.
7. `await page.emulateMedia({ media: 'screen' })` before finishing.

Catches: the data attribute writer missing, the @media print blocks getting accidentally outside their gate, or one of the templates getting deleted from globals.css.

### T1.26 — Edit button in TimelineModal when viewer owns the timeline

1. Sign in (any user with at least one entry).
2. Navigate to `/dashboard`.
3. Click any timeline card to open the modal.
4. Assert at least one `a[href^="/dashboard/entries/"]` element exists inside the `[role="dialog"]`.
5. Sign out (or use a different cookie) and navigate to `/@demo`.
6. Open any card → assert NO `a[href^="/dashboard/entries/"]` appears in the modal.

Catches regressions in the `editable` prop wiring or in the ownership check in `/u/[username]/page.tsx`.

### T1.27 — Rate limit on /api/parse-entry

```bash
for i in {1..35}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/parse-entry \
    -H "Content-Type: application/json" \
    -d '{"text":"test"}'
done | sort | uniq -c
```

- Expect a mix of 200/500 responses for the first 30 (depending on whether ANTHROPIC_API_KEY is set), then at least 1 `429` once the cap is hit.
- 429 responses should include `Retry-After` header.

### T1.28 — Skills view exists + filters timeline by ?skill=

1. Navigate to `/dashboard/skills` (auth'd) or `/@demo/skills` (public).
2. Count `a[href*="skill="]` elements — expect ≥ 1 (any user with techStack entries).
3. Click the first skill link.
4. Assert URL contains `?skill=…`.
5. Assert a "Filtering by …" pill appears on the timeline.
6. Assert the visible card count is ≤ unfiltered card count.

### T1.29 — Year review page renders stats + highlights

1. Navigate to `/dashboard/year/<current-year>` (auth'd) or `/@demo/year/2024` (public, demo data spans multiple years).
2. Assert `<h1>` text matches the year heading pattern.
3. If the year has data: assert 4 stat cards exist (entries / impact / featured / top tag), plus at least one of: "Top categories", "Top skills", "Highlights" sections.
4. If the year is empty: assert the empty-state message renders without crashing.

### T1.30 — OG image at /u/<username>/opengraph-image returns PNG

```bash
curl -sI -o /dev/null -w "%{http_code} %{content_type}\n" --max-time 30 http://localhost:3000/u/demo/opengraph-image
```

- Expect `200 image/png`. Catches regressions in the `params: Promise<...>` async signature (Next 16 made these async — easy to miss), in the database aggregation that powers the card, or in any next/og update.

### T1.31 — /@username/entry/[id] permalink renders or 404s correctly

- Valid id (use a known seed entry from the demo profile):
  - `curl -sI -w "%{http_code}" http://localhost:3000/@demo/entry/<valid-id>` → expect `200`.
- Invalid id:
  - `curl -sI -w "%{http_code}" http://localhost:3000/@demo/entry/00000000-0000-0000-0000-000000000000` → expect `404`.

### T1.32 — /api/improve-bullet returns improved + feedback (with key)

```bash
curl -s -X POST http://localhost:3000/api/improve-bullet \
  -H "Content-Type: application/json" \
  -d '{"actionVerb":"Did","title":"some work","impact":"","description":"I worked on stuff"}' | jq .
```

- With key: expect 200 + `improved` (non-empty string) + `feedback` (non-empty string).
- Without key: expect 503 + `{"error":"ANTHROPIC_API_KEY not configured"}`.

### T1.33 — Avatar URL field accepts https, rejects non-http schemes

Not Playwright-able without writing to the DB. Verify via Prisma:

```bash
npx dotenv -e .env.local -- node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Look up any user with image set — confirm it starts with http(s).
  const u = await p.user.findFirst({ where: { image: { not: null } }, select: { image: true } });
  if (u && !/^https?:\/\//.test(u.image)) {
    console.error('FAIL: bad image scheme', u.image);
    process.exit(1);
  }
  console.log('OK');
  await p.\$disconnect();
})();
"
```

- Expect `OK`. Catches a regression where saveSetup's URL validator changes and lets through `data:` / `javascript:` schemes.

### T1.34 — vitest suite green

```bash
npm test
```

- Expect all suites pass. Currently translations / skills / rateLimit. Add more as features land.

### T1.16 — /api/translate-content degrades cleanly without ANTHROPIC_API_KEY

```bash
curl -s -X POST http://localhost:3000/api/translate-content \
  -H "Content-Type: application/json" \
  -d '{"type":"entry","source":{"title":"Test","actionVerb":"Did","description":"Did a thing","impact":"","details":"","tag":"Test"},"sourceLocale":"en","targetLocale":"zh-TW"}' \
  -w "\nstatus:%{http_code}\n"
```

- **Without key**: expect `status:503` and body `{"error":"ANTHROPIC_API_KEY not configured"}`.
- **With key**: expect `status:200` and body with a `translation` object containing translated fields + `sourceHash` (16 hex chars).

### T1.12 — Quick Add nav reflects API key state

Read `.env.local` for ANTHROPIC_API_KEY:

```bash
grep -q "^ANTHROPIC_API_KEY=." /mnt/c/Users/E14-G6-01/Desktop/udemy-tutorial/my-personal-website/.env.local && echo present || echo absent
```

Then visit `/dashboard` (auth required — if no cookie available, skip this in Tier 1 and run it in Tier 2 instead). Inside the dashboard nav:

- If key **absent**: no `Quick Add` / `快速新增` link in nav AND `/dashboard/quick-add` shows the "is unavailable" / "無法使用" card with a deep link to `/dashboard/entries/new`.
- If key **present**: nav contains the Quick Add link AND `/dashboard/quick-add` shows the prompt textarea + "Parse with AI" button.

This catches accidental regressions in `src/lib/aiAvailable.ts` or its callsites.

### T1.13 — No console errors on landing + public profile

For each of: `/`, `/@demo`, `/@demo/resume`, `/@nonexistent_user_smoke_test_zzz`:

- Navigate, then call `mcp__playwright__browser_console_messages`
- Filter to `severity === 'error'`. Expect zero. React hydration mismatches, missing translation keys, and 500 errors all show up here.

## Tier 2 — Auth-required (gated on user-supplied session cookie)

Skip the entire tier if the user hasn't provided a session cookie. Output a single "Tier 2 skipped — no session cookie supplied" line in the report.

To run Tier 2:

```js
// in mcp__playwright__browser_run_code_unsafe:
async (page) => {
  const ctx = page.context();
  await ctx.clearCookies();
  await ctx.addCookies([
    { name: 'authjs.session-token', value: '<TOKEN_FROM_USER>', url: 'http://localhost:3000', httpOnly: true },
    { name: 'theme', value: 'light', url: 'http://localhost:3000' },
    { name: 'locale', value: 'en', url: 'http://localhost:3000' },
  ]);
}
```

If the user pastes a token, treat it as **sensitive credential material**: never echo it in chat, never write it to a file in the repo, never include it in commit messages. Use it for the duration of this skill run only.

### T2.1 — Dashboard timeline renders

- Navigate to `/dashboard`
- Expect: `<h1>` is "My Journey" / "我的旅程"; either the empty-state card OR at least one timeline row
- Console: 0 errors

### T2.2 — Entries list renders

- Navigate to `/dashboard/entries`
- Expect: `<h1>` matches "Manage Entries" / "管理紀錄"; either the empty state OR a `<table>` (desktop) / card list (mobile) with at least one row
- Console: 0 errors

### T2.3 — Experiences list renders

- Navigate to `/dashboard/experiences`
- Expect: `<h1>` matches "Experiences" / "經歷"; either the empty state OR at least one experience card with a per-type icon (briefcase / graduation cap / rocket / heart-handshake / palmtree) and a type badge ("Job" / "Education" / etc.)

### T2.4 — Resume builder renders

- Navigate to `/dashboard/resume`
- Expect: filter sidebar (`Filters` / `篩選`) with at least one experience checkbox + the "Other (no experience)" / "其他（未綁定經歷）" toggle. The Markdown textarea is present.

### T2.4b — EntryForm has EN / 中文 tabs with locale-suffixed inputs

This is the canary for the bilingual form added by the EntryTranslation refactor.

1. Navigate to `/dashboard/entries/new`
2. Assert two `[role="tab"]` elements exist with text "English" and "中文"
3. Assert inputs `input[name="title_en"]` and `input[name="title_zh-TW"]` both exist
4. Assert hidden inputs `input[name="primaryLocale"]`, `input[name="sourceHash_en"]`, `input[name="sourceHash_zh-TW"]`, `input[name="lastTranslatedAt_en"]`, `input[name="lastTranslatedAt_zh-TW"]` all exist
5. Click the "中文" tab → assert the EN tab's title input is hidden (display none via `[hidden]` on the panel), 中文 panel is visible
6. With ANTHROPIC_API_KEY **absent**: assert the page body contains "ANTHROPIC_API_KEY" hint text, and no `<button>` with text matching `/Translate from/i` is enabled
7. With ANTHROPIC_API_KEY **present**: assert a Translate button is present and clickable on the inactive tab

Catches regressions in the tab UX, sourceHash plumbing, and the AI-availability gate.

### T2.4c — Existing entry edit form prefills both translations

Pick any seed entry id (use Prisma query if needed: `prisma.entry.findFirst({ select: { id: true } })`) and navigate to `/dashboard/entries/<id>`. Both tabs must have their inputs pre-filled (i.e. `input[name="title_en"].value` and `input[name="title_zh-TW"].value` are both non-empty for a seed entry). This catches a forgotten `include: { translations: true }` in getEntryDetail.

### T2.5 — Inline-create experience from entry form

This is the canary for the inline-create flow added in commit `5ae42ab`.

1. Navigate to `/dashboard/entries/new`
2. Find the Experience `<select>` — assert the last `<option>` value is `__new__` with label starting `+ Create new experience` / `+ 建立新經歷`
3. Select that option → modal opens (snapshot should show `role="dialog"` with title "New Experience" / "新增經歷")
4. Cancel via the modal's Cancel button → assert the modal closes AND the parent select reverted to its previous value (not `__new__`)
5. Re-open the modal → fill `Type=Job`, `Company="Smoke Test Co."`, `Role="QA Bot"`, `StartDate=2026-01-01` → submit
6. Assert: modal closed, the new option appears in the parent select AND is auto-selected
7. **Cleanup**: navigate to `/dashboard/experiences`, find "Smoke Test Co.", delete it via the row's Delete button + confirmation. Skip cleanup if Tier 2 is being run in dry-run mode (declared in the user's invocation).

### T2.6 — Create + delete entry round-trip

1. From `/dashboard/entries/new`, fill: Date today, Title "Smoke test entry", Tag "Test", Description "Created by smoke test"
2. Submit → expect redirect to `/dashboard/entries` with the new row at the top
3. Find the row and click Delete → confirm in dialog
4. Expect the row to disappear from the list

### T2.7 — Theme + locale survive auth navigation

While signed in, switch theme to `dark` and locale to `zh-TW`, navigate to `/dashboard/entries`, then back to `/dashboard`. Both should remain applied. Reset to `light` / `en` afterwards.

## Tier 3 — Optional: AI parse endpoint

Only runs when `ANTHROPIC_API_KEY` is set. If absent, expect Tier 1.12 to already cover the degraded path.

### T3.1 — POST /api/parse-entry returns structured fields

```bash
curl -s -X POST http://localhost:3000/api/parse-entry \
  -H "Content-Type: application/json" \
  -d '{"text":"Today I migrated the auth flow from custom JWT to NextAuth, cutting boilerplate by 200 lines."}' | jq .
```

- Expect a JSON object with non-empty `actionVerb`, `title`, `description`, and arrays for `techStack` (may be empty).
- Watch for: the model returning markdown fences (the route strips them) or invalid JSON (should produce a 500 `error` field).
- This burns ~$0.0001 of Anthropic credit per run — leave to the user to opt in.

## Report format

Output should be structured Markdown. Keep failed-check diagnostics terse — file path + one-line symptom. Example:

```
## Smoke test report

**Result: 14 passed · 1 failed · 2 skipped**

### Tier 1
✅ T1.1 Landing renders
✅ T1.2 /@demo timeline
…
❌ T1.9 i18n key parity — EN-only: ['QuickAdd.unavailableHint']
   Fix: add `QuickAdd.unavailableHint` to messages/zh-TW.json or remove from en.json.

### Tier 2 — skipped (no session cookie supplied)

### Tier 3 — skipped (ANTHROPIC_API_KEY absent)
```

## Updating this skill

This skill is intentionally a checklist, not a fixed test suite — it's expected to drift with the product. Update it when:

| Change | Update |
|---|---|
| Add a new route in `src/app/**/page.tsx` that's user-facing | Add a Tier 1 (unauth pages) or Tier 2 (auth pages) check |
| Rename a translation key | T1.9 will catch the parity break; also update any T1.X checks that asserted on the old string |
| Add a new theme / locale | Extend T1.6 / T1.7 to include the new value; update T1.8's "combined" assertion |
| Add a new sensitive env var | Extend T1.12-style env-conditional checks |
| Add a new translatable field on Entry / Experience | Extend T1.14 with a token from the seed for that field; update extractFormData parsers via grep |
| Add a non-text language-neutral field on Entry / Experience | No skill update needed — it lives on the parent, not the translation table |
| Add a new auth provider | Add a Tier-1 check parallel to T1.17 that drives the new provider's signup/signin |
| Add a new résumé filter | Extend T1.19 with a check that flipping the filter changes the bullet count |
| Add new print-hidden chrome | Add the class (`resume-print-hide` or `no-print`) and confirm T1.20 still picks it up |
| Add a new print template | Extend T1.25 with a selector for the new template value + a check on a distinguishing CSS property |
| Add a new searchable field on entries | Update T1.22 to use a token from that field in the test query |
| Add a new follow-up question id in QuickAdd | Update the route's VALID_QUESTION_IDS allowlist; T1.23 stays valid as long as the model still asks at least one question |
| Add a new AI API endpoint | Wire rateLimit + auth like the others; add an env-aware Tier 1 check parallel to T1.27 / T1.32 |
| Change the OG image card | Re-run T1.30 to confirm 200 + image/png; consider snapshot-diffing the PNG bytes |
| Add a new dashboard route | Add a Tier-1 check that navigates there + asserts heading; if it accepts a URL param, parallel T1.28 / T1.29 |
| Remove a feature | Mark the corresponding check `### Removed in <commit-sha>` rather than deleting (so reviewers can see the history) |
| Add an interactive flow that mutates DB | Add a Tier 2 check with its own cleanup step (or declare the residue clearly) |

When making the update, keep checks small (one assertion each) and prefer `document.querySelector` / `aria-label` matches over CSS-selector chains that will rot.

## Known limitations

- **Google OAuth full sign-in** is not automated — Google's bot detection blocks headless flows. Tier 2 requires a pre-baked session cookie from the user.
- **Cross-tab cookie sync** isn't tested.
- **Visual regressions** (e.g. accidental layout shifts) aren't covered — this skill is functional, not pixel-diff.
- **Performance / Lighthouse** is out of scope.
- **Race conditions in server actions** (e.g. concurrent create + delete) are not exercised.
