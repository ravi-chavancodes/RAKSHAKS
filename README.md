# RAKSHAK

Location-based emergency reporting and response coordination platform built with **Next.js 16** (App Router, strict TypeScript), **Tailwind CSS v4**, **shadcn/ui**, **Motion**, **MapLibre GL v5**, and **Supabase** (Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions).

> **Important:** RAKSHAK is a coordination aid, not a replacement for official emergency services (**112**, **108**, **101** in India).

---

## Architecture & Key Safeguards

- **Non-blocking SOS Submission**: `POST /api/incidents` validates with Zod v4, enforces `client_request_id` idempotency, rate-limits to 10 requests per IP per 10 minutes, optionally stores 10-second audio in a private `incident-audio` bucket, and confirms `"Submitted"` only after database storage succeeds.
- **Advisory AI (`RAKSHAK AI`)**: Post-submission triage runs asynchronously (`after()` / `analyze-incident` Edge Function) without personal contact details and never overwrites the reporter's selected category.
- **Strict Status Machine & Audit Trail**: All status transitions pass through `public.transition_case_status()` and are recorded in `public.status_history` and `public.audit_logs`. `"Assigned"` (notified) and `"Accepted"` (explicit responder ownership) are strictly separated.
- **Row Level Security**: Enabled on every table (`profiles`, `incidents`, `responders`, `assignments`, `status_history`, `audit_logs`, `notifications`).

---

## Repository Layout

```text
rakshak/
├── .github/workflows/ci.yml   # Lint, Vitest, Next build, Playwright E2E
├── CHANGELOG.md               # Platform release history
├── supabase/
│   ├── migrations/            # PostGIS schema, RLS, triggers, Realtime, Storage
│   ├── functions/             # analyze-incident Edge Function
│   ├── tests/                 # SQL RLS & status transition tests
│   └── seed.sql               # Sample verified responders
└── rakshak-web/               # Next.js 16 web application
```

---

## Prerequisites

- **Node.js** 22+ and **npm** 10+
- **Supabase** project (or Docker Desktop for local `supabase start`)

---

## Local Setup

1. **Install dependencies**:

   ```bash
   cd rakshak-web
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`, and `NVIDIA_MODEL` in `rakshak-web/.env.local`. Never commit `.env` or `.env.local`.

3. **Run the development server**:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

---

## Verification & Tests

Run from `rakshak-web/`:

```bash
npm run lint      # ESLint
npm test          # Vitest unit tests
npm run build     # TypeScript strict + Next.js production build
npm run test:e2e  # Playwright E2E suite (TC-01 to TC-06 + mobile checks)
```
