# RAKSHAK — Test & Security Verification Report

## 1. Unit Tests (Vitest)
Command: `npm test` (inside `rakshak-web/`)
Result: **2 test files, 13 passed, 0 failed** (`381ms`)

- [report-schema.test.ts](file:///c:/Users/smart/OneDrive/Desktop/rakshak/rakshak-web/tests/unit/report-schema.test.ts) (6 tests):
  - Self SOS with GPS validation — **PASS**
  - Third-Person SOS with manual landmark & null GPS — **PASS**
  - Rejection when both GPS and manual location are missing — **PASS**
  - 500-character description limit enforcement — **PASS**
  - Login email & min 6-char password validation — **PASS**
  - Registration `fullName` requirement — **PASS**
- [transitions-and-routing.test.ts](file:///c:/Users/smart/OneDrive/Desktop/rakshak/rakshak-web/tests/unit/transitions-and-routing.test.ts) (7 tests):
  - Allowed status transitions (`submitted → under_review → assigned → accepted → in_progress → closed`, escalation) — **PASS**
  - Blocked invalid skips (`submitted → accepted`, `closed → in_progress`) — **PASS**
  - Category routing (`human` → medical only, `animal_bird` → animal only, unverified/paused excluded) — **PASS**
  - No-match returns empty array — **PASS**
  - Rate limiter (`10` requests per IP per `10 minutes`, 11th blocked, resets after window) — **PASS**
  - UUID `client_request_id` idempotency key format — **PASS**

---

## 2. End-to-End Tests (Playwright)
Command: `npm run test:e2e` (against production `next start -p 3100`)
Result: **4/4 specs passed (`11.9s`)**

| SRS TC | Scenario | Result | Screenshot |
| --- | --- | --- | --- |
| **TC-01** | Self SOS with GPS (`12.9716, 77.5946`) creates case & displays `RK-YYYYMMDD-XXXX` + `112` | **PASS** | [tc01-self-sos.png](file:///c:/Users/smart/OneDrive/Desktop/rakshak/docs/screenshots/tc01-self-sos.png) |
| **TC-02** | Third-Person SOS with manual landmark (`Outside Indiranagar Metro Gate B`) | **PASS** | [tc02-third-person.png](file:///c:/Users/smart/OneDrive/Desktop/rakshak/docs/screenshots/tc02-third-person.png) |
| **TC-03** | Microphone denied / skipped still allows submission | **PASS** | [tc02-third-person.png](file:///c:/Users/smart/OneDrive/Desktop/rakshak/docs/screenshots/tc02-third-person.png) |
| **TC-04** | Post-submission AI non-blocking; `/track/[ref]` renders cleanly | **PASS** | [tc05-no-match.png](file:///c:/Users/smart/OneDrive/Desktop/rakshak/docs/screenshots/tc05-no-match.png) |
| **TC-05** | No responder match keeps status `under_review` and shows `112 / 108 / 101` message | **PASS** | [tc05-no-match.png](file:///c:/Users/smart/OneDrive/Desktop/rakshak/docs/screenshots/tc05-no-match.png) |
| **TC-06** | Unauthorised user visiting `/responder` or `/admin` is redirected to login | **PASS** | — |

---

## 3. Security Checklist
- **`.gitignore` Verified**: Root [.gitignore](file:///c:/Users/smart/OneDrive/Desktop/rakshak/.gitignore) and [rakshak-web/.gitignore](file:///c:/Users/smart/OneDrive/Desktop/rakshak/rakshak-web/.gitignore) exclude `.env` and `.env.*` (except `.env.example`).
- **RLS Enabled**: All 7 tables (`profiles`, `incidents`, `responders`, `assignments`, `status_history`, `audit_logs`, `notifications`) have RLS enabled with explicit `TO authenticated` policies (no `using (true)`).
- **Client Bundle Secret Scan**: Searched `rakshak-web/.next/static/**/*.js` for `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`, and secret tokens — **0 matches (`CLEAN`)**.
- **Rate Limiting**: `POST /api/incidents` enforces **10 requests per IP per 10 minutes** via [rate-limit.ts](file:///c:/Users/smart/OneDrive/Desktop/rakshak/rakshak-web/src/lib/security/rate-limit.ts), returning HTTP `429` with `Retry-After`.
- **No Sensitive Request Logging**: Verified zero `console.log` statements printing request bodies, phone numbers, or coordinates.
- **CI Workflow**: Configured in [.github/workflows/ci.yml](file:///c:/Users/smart/OneDrive/Desktop/rakshak/.github/workflows/ci.yml).

---

## 4. Deployment Status
- **Local Production Build (`npm run lint && npm run build`)**: **PASS** (0 errors, 0 warnings).
- **Pending Remote CLI Auth**: `supabase db push`, `supabase functions deploy analyze-incident`, and `vercel --prod` require interactive CLI authentication (`supabase login` / `vercel login`) on this machine.
