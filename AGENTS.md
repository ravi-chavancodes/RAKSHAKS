# RAKSHAK – Project Brain

## What we are building
RAKSHAK is a location-based emergency reporting and response coordination web app (Next.js + Supabase).
It is a COORDINATION AID, not a replacement for official emergency services (112 / 108 / 101 in India).

## Non-negotiable product rules
1. A case is "Submitted" ONLY after the backend confirms storage. Never show "help contacted" before that.
2. "Assigned" = a responder was notified. "Accepted" = a responder explicitly accepted. Never conflate them.
3. AI output is advisory and always labeled as AI-suggested. Never show AI priority as a medical assessment.
4. SOS submission must NOT wait on AI, audio upload, or notifications.
5. GPS denial must always offer manual location entry.
6. Audio is optional (10 seconds). Its failure must never block submission.
7. Emergency numbers (112, 108, 101) must always be visible on SOS screens.
8. All status changes go through one server-side transition function and are written to status_history.
9. Row Level Security is enabled on every table. No table is accessible without an explicit policy.

## Stack
Next.js (App Router, TypeScript strict), React 19, Tailwind CSS v4, shadcn/ui, Motion, React Hook Form + Zod v4,
TanStack Query v5, Supabase (Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions), MapLibre GL v5, Vitest, Playwright.

## Code standards
- TypeScript strict. No `any`. No `@ts-ignore` without a comment explaining why.
- Server-only secrets live in `.env.local` and are never imported in client components.
- Every feature folder: `components/`, `actions/` or `api/`, `schemas/`, `types.ts`.
- Errors are typed (`Result<T, E>` or equivalent). Never swallow errors silently.
- Every user-facing string goes through a `copy.ts` file (we will add Hindi/English later).

## Design system
- Clean, modern, minimal. Large type scale, generous whitespace, one accent color, soft neutral surfaces.
- Motion is purposeful: entrance reveals, status transitions, and button/card hover. Respect `prefers-reduced-motion`.
- Mobile-first. Tap targets at least 44px. Contrast at least WCAG AA.