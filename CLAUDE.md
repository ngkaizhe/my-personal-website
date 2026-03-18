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

This is a personal portfolio website built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma (PostgreSQL).

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
- **Data model:** Two Prisma models — `TimelineItem` (journey entries with year, title, category, description, tech stack, links) and `Icon` (Lucide icon names, related 1:many to TimelineItem).
- **Timeline component:** `src/components/Timeline/` is a client-side component tree (Timeline → TimelineRow → TimelineCard/TimelineIcon) with a modal for details. Uses Framer Motion (`motion` package) for animations.
- **Styling:** Mix of Tailwind CSS utility classes and styled-components.
- **Font:** Montserrat (bold 700) loaded via `next/font/google`.

### Database

PostgreSQL via Prisma. Connection string from `DATABASE_URL` env var. Schema in `prisma/schema.prisma`, seed in `prisma/seed.ts`.
