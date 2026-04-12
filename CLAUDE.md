# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (runs `prisma generate` automatically via `predev` script, then starts Next.js on port 3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Prisma generate:** `npx prisma generate` (also runs automatically on `npm install` via `postinstall`)
- **Prisma migrate:** `npx prisma migrate dev`
- **Prisma seed:** `npx prisma db seed`
- **Prisma Studio:** `npx prisma studio --browser none` (DB GUI on port 5555)

## Architecture

This is a personal portfolio website built with **Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Prisma (PostgreSQL)**.

### Routing

- `/` redirects to `/dashboard`
- `/dashboard` — public-facing timeline page showing journey items (server component that fetches from DB)
- `/dashboard/journeys` — CRUD management for timeline items
- `/dashboard/journeys/new` — create new journey
- `/dashboard/journeys/[id]` — edit existing journey

### Key patterns

- **Server Actions:** All database mutations live in `src/app/dashboard/journeys/actions.ts` (create, update, delete timeline items). The public read action is in `src/app/dashboard/actions.tsx`.
- **Prisma singleton:** `src/lib/prisma.ts` exports a singleton Prisma client (cached on `globalThis` in dev to survive HMR).
- **Path alias:** `@/*` maps to `./src/*`.
- **Data model:** Two Prisma models — `Journey` (entries with year, title, tag, description, tech stack, links) and `Icon` (Lucide icon names, related 1:many to Journey).
- **Timeline component:** `src/components/Timeline/` is a client-side component tree (Timeline → TimelineRow → TimelineCard) with a TimelineModal. Uses Framer Motion (`motion` package) for animations.
- **Font:** Montserrat loaded via `next/font/google` with weights 400/500/600/700.

### Database

PostgreSQL via Prisma. Connection string from `DATABASE_URL` env var. Schema in `prisma/schema.prisma`, seed in `prisma/seed.ts`.

## Theme System (important — non-obvious)

The project supports **three themes** (light, dark, sepia) via a CSS-variable-based design token system. This is **not** a typical `dark:` prefix setup.

### How it works

1. **Tokens defined in `src/app/globals.css`** using Tailwind v4's `@theme` block for default (light) values, plus `.dark` and `.sepia` class selectors that override the same variables.
2. **Tailwind utilities** like `bg-surface`, `text-text-primary`, `border-border-light` are auto-generated from the `@theme` variable names.
3. **`ThemeProvider.tsx`** toggles the class on `<html>` and persists to localStorage.
4. **FOUC prevention:** An inline blocking script in `src/app/layout.tsx` (`themeInitScript`) reads localStorage and applies the class before React hydrates. The `<html>` has `suppressHydrationWarning` because of this intentional mutation.

### Adding a new theme

1. Add a new class block in `globals.css` (e.g. `.nord { --color-page: ...; ... }`) overriding all tokens.
2. Add the theme value and metadata to `THEME_OPTIONS` in `src/components/ThemeProvider.tsx`.
3. Add the icon component to `iconMap` in `src/components/ui/ThemeToggle.tsx`.

Components automatically adapt — no changes needed anywhere else.

### Dynamic accent colors

Per-journey colors (green, purple, etc.) come from Tailwind's standard palette via `src/lib/colors.ts`. Those classes are safelisted in a `_safelist` array at the bottom of that file so Tailwind's content scanner picks them up.

For sepia mode, elements that need saturation boost are marked with `data-palette-accent` attribute. The `.sepia [data-palette-accent]` rule in `globals.css` applies a CSS filter. Do **not** use fragile substring selectors like `[class*="bg-"][class*="-100"]` — use the data attribute instead.

### Important: Tailwind v4 gotcha

**Do NOT define colors in `tailwind.config.js`.** Tailwind v4 does not read custom colors from the config file. Colors must be declared in `@theme { ... }` inside `globals.css`. The config file is only used for `content` paths.

## Accessibility conventions (established)

- `TimelineCard` is a `motion.div` with `role="button"`, `tabIndex={0}`, Enter/Space keyboard handlers, `aria-label`, and `focus-visible:ring-*`. Keep this pattern for any other clickable cards.
- `TimelineModal` has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap (Tab cycling), Escape to close, and initial focus on the close button. Same goes for `JourneyList`'s delete confirmation dialog.
- `ThemeToggle` dropdown uses `role="menu"` + `role="menuitemradio"`, full arrow-key/Home/End/Escape navigation, and focus returns to the trigger on close.
- Form labels are linked via `htmlFor`/`id` pairs. Error state uses `role="alert"`.
- Animations use Framer Motion's `useReducedMotion()` hook. When adding new animations, check this hook and disable the `initial`/`animate` states if true.
- The layout has a `<main>` landmark and a visually-hidden skip-nav link. Pages should use `<h1>` (Timeline's heading is the h1 for `/dashboard`).
- WCAG AA contrast is enforced for `text-faint` (4.5:1 minimum).

## WSL / Windows development quirks

**Project path is on `/mnt/c/`** (Windows filesystem mounted in WSL). This causes several issues:

- **`node_modules` native binaries:** Running `npm install` in WSL installs Linux binaries; running on Windows installs Windows binaries. They conflict. Generally, run the dev server on **Windows** (PowerShell) to avoid `Cannot find module 'lightningcss.linux-x64-gnu.node'` errors.
- **Line endings:** `.gitattributes` enforces LF for all text files. If you see huge diffs with `10000 insertions / 10000 deletions`, it's a CRLF issue — run `git checkout -- .` and it should resolve.
- **Playwright MCP from WSL → Windows dev server:** Playwright's Chromium runs in WSL, but `localhost:3000` there won't reach a dev server on Windows. Start the Windows dev server with `npx next dev -H 0.0.0.0` and access it from WSL using the Windows host IP (`ip route show default | awk '{print $3}'`, typically `172.30.192.1` or similar). Example: `http://172.30.192.1:3000/dashboard`.
- **Playwright artifacts:** `.playwright-mcp/` directory is gitignored. Do not commit screenshots from it.

## Git conventions

- **Commit style:** Conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Use multi-line commits with `-m` for each paragraph (never heredoc).
- **Co-author trailer:** `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
- **`.gitattributes`** forces LF line endings — do not modify.
- The user prefers **one commit per logical change**, not batched mega-commits. When doing multi-step refactors, commit after each step.

## Known issues / limitations

- **Chromium for Playwright MCP plugin** is hardcoded to look for `/opt/google/chrome/chrome` in some environments. The bundled Playwright Chromium at `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` may not be detected. Workaround: install `google-chrome-stable` via apt (requires sudo) or run Playwright tests from Windows.
- **17 Dependabot vulnerabilities** reported by GitHub (7 high / 9 moderate / 1 low). Not yet addressed. See https://github.com/ngkaizhe/my-personal-website/security/dependabot.
