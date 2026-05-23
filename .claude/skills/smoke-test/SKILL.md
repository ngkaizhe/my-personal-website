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
| Remove a feature | Mark the corresponding check `### Removed in <commit-sha>` rather than deleting (so reviewers can see the history) |
| Add an interactive flow that mutates DB | Add a Tier 2 check with its own cleanup step (or declare the residue clearly) |

When making the update, keep checks small (one assertion each) and prefer `document.querySelector` / `aria-label` matches over CSS-selector chains that will rot.

## Known limitations

- **Google OAuth full sign-in** is not automated — Google's bot detection blocks headless flows. Tier 2 requires a pre-baked session cookie from the user.
- **Cross-tab cookie sync** isn't tested.
- **Visual regressions** (e.g. accidental layout shifts) aren't covered — this skill is functional, not pixel-diff.
- **Performance / Lighthouse** is out of scope.
- **Race conditions in server actions** (e.g. concurrent create + delete) are not exercised.
