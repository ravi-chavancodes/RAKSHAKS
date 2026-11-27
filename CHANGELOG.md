# Changelog

All notable changes to the RAKSHAK platform are documented in this file.

## [0.2.0] - 2026-11-27

### Added
- Interactive full-viewport scroll storytelling canvas (`RakshakStoryCanvas` and `story-vector-art`) illustrating highway approach, crosswalk collision (`HIT!` impact feedback), bystander smartphone photo & GPS capture, rear-view ambulance stretcher rescue, and full departure before final SOS call-to-action fade-in.
- True `9:16` smartphone hardware mockup (`StoryPhoneHud`) synchronized with scene progress on desktop, paired with a compact bottom status bar for mobile screens.
- Three dynamically placed story captions with character-by-character typing reveals and `prefers-reduced-motion` support.
- Responsive mobile hamburger navigation drawer (`#mobile-nav-drawer`) in the global sticky header alongside a quick-access SOS button and direct `112` / `108` / `101` dial links.
- Official RAKSHAK shield emblem and wordmark integrated across the navbar, footer, favicon metadata, and `/about` route.

### Fixed
- Resolved a visibility bug where below-the-fold dispatch guarantee cards in `#overview-content` could stay hidden (`opacity: 0`) behind `whileInView` intersection delays after scrolling or jumping via anchor links.
- Prevented horizontal document overflow and multi-line link wrapping on mobile viewports.

### Changed
- Rewrote landing page and story copy for plain, direct civic clarity and replaced redundant card styling with hairline architectural grids and typographic ledgers.
- Removed temporary verification screenshots and internal testing report artifacts from the repository for a clean production structure.

## [0.1.0] - 2026-11-25

### Added
- Initial Next.js 16 + Supabase (Postgres/PostGIS, Auth, Storage, Realtime) foundation for location-based emergency reporting and coordination.
- 6-step citizen SOS flow (`/report`) with GPS pin selection, manual address fallback, optional 10-second private audio recording, idempotent submission (`client_request_id`), and rate-limited `POST /api/incidents`.
- Live case tracker (`/track/[ref]`), password-authenticated citizen and responder portals (`/login`, `/dashboard`, `/responder`), and isolated administrator portal (`/admin/login`, `/admin`).
- Server-enforced status state machine (`transition_case_status()`) separating `Submitted`, `Assigned`, and `Accepted`, backed by RLS policies, Vitest unit tests, and Playwright E2E coverage.
