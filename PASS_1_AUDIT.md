# Islam Roots — Pass 1 Repository Audit

**Scope.** This is a non-modifying, static and build-level first pass for `MAHMOUDELWANY/islam-roots2` on the `main` branch. The working tree was clean before the review. No application files, dependency manifests, lockfiles, database schema, or Git history were changed.

> **Decision point:** The report intentionally does not apply fixes. The items marked **Approve?** are the minimal, recommended Pass 2 groups. Some security fixes will deliberately reject requests that are currently accepted.

## Quick check

| Area | Detected state | Evidence |
| --- | --- | --- |
| Language and UI | TypeScript/TSX with **React 19** | `package.json:25–26`, `src/` |
| Frontend build | **Vite 6** with Tailwind CSS 4 | `package.json:17,27,35,38`, `vite.config.ts` |
| Server | Node.js/TypeScript with **Express 4**; Vercel function forwards to the bundled server | `server.ts`, `api/index.js:5–11`, `vercel.json:3–11` |
| Data and authentication | Supabase browser client, server-side Supabase client, RLS policy SQL | `src/lib/supabase.ts`, `src/lib/supabase-admin.ts`, `supabase/schema.sql` |
| AI | Google Gemini server-side calls | `server.ts:16–30,93–420` |
| Package manager | **Bun** is indicated by `bun.lock`; npm was used only for isolated, non-writing registry/audit checks because Bun is unavailable in the environment | `bun.lock:2–35` |
| Tests | **No automated test runner or test command exists.** The `test-*.ts` files are standalone diagnostic scripts without assertions or runner integration. | `package.json:6–12`; e.g. `test-auth.ts:2–5` |

The isolated static type check and production build both passed. However, the lack of automated tests means this is **not** evidence that any future change is safe or functionally equivalent. The riskiest changes are request validation/rate limiting, RLS or role-flow changes, and removing browser persistence; each needs focused tests before deployment.

| High-value quick test to add before Pass 2 | Why it matters |
| --- | --- |
| API contract tests for every `/api/gemini/*` route | Verify unauthenticated, oversized, malformed, out-of-range, and valid requests; confirm safe failure behavior. |
| Supabase integration tests using non-admin and super-admin users | Verify RLS and that a user cannot read, mutate, or export another teacher’s data. |
| Client mutation tests for failed Supabase writes | Ensure optimistic UI is rolled back or visibly marked unsaved instead of silently appearing successful. |
| Browser-storage and Google OAuth tests | Verify a session reload/logout clears tokens and guest data according to the product decision. |

## Security — prioritized findings

No committed secret value was found in the tracked tree. The only tracked environment file is `.env.example`, which contains empty placeholders; the credential scan found variable names and placeholder strings only. The review also found no `eval`, shell execution, or user-controlled `dangerouslySetInnerHTML`. The two DOM writes in the tour component are static styling/progress markup, not user-provided HTML (`src/components/common/JalilahTourModal.tsx:66–89,191–293`).

| Priority | Finding and location | Why it matters | Suggested smallest fix | Approve? |
| --- | --- | --- | --- | --- |
| **High** | **AI endpoints accept unvalidated request bodies and use them directly in prompts.** `server.ts:14,94–222,226–268,272–323,326–420` | Any authenticated user can send arbitrary strings, malformed types, excessive `count`/duration values, and up to 5 MB JSON bodies. This creates avoidable model-cost, availability, and output-integrity risk. The provider schema does not validate the incoming request or validate parsed output at the application boundary. | Add a shared server-side runtime schema for each route: required fields, trimmed string length caps, allowed enums, numeric ranges, max quiz count, and a small JSON body limit. Validate parsed model output before returning it. Reject invalid input with a generic 400 response. | **Yes — intentional behavior change:** invalid/out-of-range requests will be rejected. |
| **High** | **No rate limiting or per-user generation quota exists on costly AI routes.** `server.ts:94–420` | Authentication alone does not prevent rapid repeated model requests, which can exhaust Gemini quota and increase cost. The client already anticipates a 429 response but the server never produces one. | Apply a bounded per-user rate limit to the four AI routes, with a conservative response and clear retry guidance. Keep the implementation server-side. | **Yes — intentional behavior change:** users can receive 429 after the chosen threshold. **Decision needed:** desired quota/window. |
| **Medium** | **Server “admin” client can fall back to the public browser anon key.** `src/lib/supabase-admin.ts:17–25` | A `VITE_*` key is intentionally client-exposed and must never be treated as a service credential. If the service-role variable is missing, privileged server operations may fail unpredictably or execute under weaker permissions. | Require a private service-role/secret key for the server client; fail initialization safely when it is absent. Do not fall back to `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`. | **Yes — intentional behavior change:** a misconfigured deployment will fail closed rather than run with an anon key. |
| **Medium** | **Broad Google OAuth tokens are retained in `sessionStorage`; the requested scopes include broad Gmail and Drive access.** `src/context/AuthContext.tsx:56–67,436–516` | Any same-origin script exposed through a future XSS flaw can read these bearer tokens. The current scopes increase the potential impact. | Keep access tokens in memory where feasible, clear them on navigation/session end, and request only feature-specific minimum scopes. Consider server-side OAuth storage only if a durable integration is truly required. | **Needs product decision:** session persistence versus reauthorization after reload; required Google features/scopes. |
| **Medium** | **Guest mode persists student and lesson data in `localStorage`.** `src/context/DataContext.tsx:84–105,349–403` | Stored data can include student name, email, age, notes, lesson sessions, schedules, homework, and generated content. Browser local storage is persistent and readable by same-origin scripts. | Make guest persistence opt-in, use `sessionStorage` for default guest sessions, add a clear-device-data action, and warn against storing real student data in guest mode. | **Needs product decision:** persistence convenience versus student-data privacy. |
| **Low** | **Provider/upstream error text is sent to the client.** `server.ts:71–74,87–90,219–222,265–268,319–322,371–374,417–420` | Raw messages can reveal implementation/provider details and make client behavior less predictable. | Log sanitized diagnostic context server-side; return a stable, generic user-facing error code/message. | **Yes** |
| **Low** | **The designated administrator identity is duplicated and hard-coded in client/server/UI code.** `server.ts:41–52`, `src/context/AuthContext.tsx:6,202–221,631–650`, `src/components/admin/AdminDashboard.tsx:238–250` | This is not a secret, but it exposes a personal identity, creates configuration drift, and partly drives client-side display logic. Database RLS still provides the important data boundary. | Move the bootstrap identity to a private server configuration or an audited role-assignment migration; derive UI state only from the server/RLS-backed claim. | **Needs product decision:** the approved first super-admin provisioning path. |

### Authentication, injection, and CORS assessment

| Check | Result | Notes |
| --- | --- | --- |
| Protected API routes | **No missing route guard found in static review** | All four Gemini routes and `/api/auth/claim-admin` use `requireAuth` (`server.ts:34,94,226,272,326`). `requireAuth` verifies the bearer token server-side (`src/middleware/auth.ts:14–39`). |
| Data authorization | **RLS is defined in the tracked schema** | All listed tables enable RLS (`supabase/schema.sql:165–175`) and have tenant policies. This cannot prove that the production database has the schema/policies applied; it needs the proposed integration test. |
| SQL/command injection | **No direct SQL construction or OS-command execution found** | Database access uses Supabase client calls; server routes construct external Quran API URLs from a route parameter without validation (`server.ts:77–83`), which should be bounded as a minor hardening item. |
| XSS / unsafe HTML | **No user-controlled raw HTML found** | The two identified uses are static CSS or DOM clearing in the guided tour. Preserve this conclusion only while their inputs remain static. |
| CORS | **No overly open CORS configuration found** | No CORS middleware/headers are configured in the tracked server entry point. |

## Dependencies

The project declares Bun through `bun.lock`, but Bun was not installed in this environment. An isolated npm resolution was created outside the repository solely to run the advisory scan. It reported **0 known vulnerabilities** across the resolved graph (208 production, 16 development, 108 optional dependencies). Because npm resolution is not a substitute for the checked-in Bun lock, rerun `bun audit` in CI or a Bun-enabled environment after any lockfile update.

The table compares **manifest-declared versions** with the current npm registry release queried during this audit. The checked-in Bun lock already resolves some compatible ranges beyond the manifest’s lower bound, so Pass 2 should update the manifest and regenerate `bun.lock` together. Registry metadata is available from npm. [1]

| Package | Declared | Latest | Recommendation |
| --- | ---: | ---: | --- |
| `@google/genai` | `^2.4.0` | `2.17.0` | Apply minor update after the input/output validation work. |
| `@supabase/supabase-js` | `^2.112.2` | `2.112.3` | Apply patch update. |
| `@tailwindcss/vite` | `^4.1.14` | `4.3.3` | Apply minor update. |
| `@vitejs/plugin-react` | `^5.0.4` | `6.0.5` | **Major — defer.** Review Vite/plugin migration compatibility. |
| `dotenv` | `^17.2.3` | `17.4.2` | Apply minor update. |
| `driver.js` | `^1.8.0` | `1.8.0` | Current. |
| `express` | `^4.21.2` | `5.2.1` | **Major — defer.** Express 5 route/error-handling migration review. |
| `html2canvas` | `^1.4.1` | `1.4.1` | Current. |
| `lucide-react` | `^0.546.0` | `1.31.0` | **Major — defer.** Validate renamed/removed icon exports. |
| `motion` | `^12.23.24` | `13.1.0` | **Major — defer.** Review Motion 13 migration notes. |
| `react` | `^19.0.1` | `19.2.8` | Apply minor update with `react-dom` as a pair. |
| `react-dom` | `^19.0.1` | `19.2.8` | Apply minor update with `react` as a pair. |
| `vite` | `^6.2.3` in both dependency sections | `8.2.1` | **Major — defer.** Remove the duplicate declaration only after choosing the intended production/dev classification. |
| `@types/express` | `^4.17.21` | `5.0.6` | **Major — defer.** Keep Express 4-compatible types until Express is migrated. |
| `@types/node` | `^22.14.0` | `26.2.0` | **Major — defer.** Check hosting/runtime support first. |
| `autoprefixer` | `^10.4.21` | `10.5.4` | Apply minor update. |
| `esbuild` | `^0.25.0` | `0.28.2` | Apply compatible 0.x update cautiously; build immediately afterwards. |
| `pngjs` | `^7.0.0` | `7.0.0` | Current. |
| `tailwindcss` | `^4.1.14` | `4.3.3` | Apply minor update with `@tailwindcss/vite`. |
| `tsx` | `^4.21.0` | `4.23.12` | Apply minor update. |
| `typescript` | `~5.8.2` | `7.0.2` | **Major — defer.** The safe patch target within the current tilde range is `5.8.3`; TypeScript 7 needs a separate migration review. |

| Scan | Result | Follow-up |
| --- | --- | --- |
| Isolated `npm audit --package-lock-only` | **0 vulnerabilities** | Re-run with Bun against the regenerated `bun.lock` in Pass 2/CI. |
| Static type check | **Passed** | `npm run lint` completed in an isolated copy. Note that `noUnusedLocals` and `noUnusedParameters` are not enabled (`tsconfig.json:2–29`). |
| Production build | **Passed** | Isolated build completed. The main application bundle is roughly 900 kB (about 223 kB gzip), which is a worthwhile future performance budget target but not a Pass 2 blocker. |

## Duplicated logic

| Priority | Finding and location | Why it matters | Suggested safe refactor | Approve? |
| --- | --- | --- | --- | --- |
| **Medium** | **AI request/session/timeout/JSON/error-mapping flow is duplicated.** `src/components/studio/LessonStudioView.tsx:266–343`; `src/components/studio/QuizHomeworkModal.tsx:60–136`; a similar request exists in the Slides export flow at `LessonStudioView.tsx:103–210`. | Fixing authentication expiry, abort handling, server error parsing, or telemetry requires parallel edits and can cause inconsistent user messages. | Extract a typed `requestAuthenticatedAi` helper or hook that owns token lookup, timeout, JSON parsing, and stable error mapping; each screen keeps its endpoint and payload. | **Yes** — intended to preserve behavior. |

No other duplication was proposed because the database entity mappers and CRUD operations encode distinct table fields and behavior; forcing a generic abstraction now would be more architectural than the requested cleanup.

## Obvious refactors and reusable pieces

| Priority | Finding and location | Why it matters | Suggested smallest fix | Approve? |
| --- | --- | --- | --- | --- |
| **Low** | **Server helpers are compressed into a single untyped line.** `server.ts:17–30` | The timeout/helper lifecycle is hard to review and reuse; `any` hides input/output errors. | Split into named, typed helpers and clear timeout handles when the model request settles. Do not change route behavior in this cleanup. | **Yes** |
| **Low** | **`vite` is declared in both `dependencies` and `devDependencies`.** `package.json:27,38` | It creates unnecessary manifest ambiguity; Vite is needed for build/dev, but production runtime requirements should be explicit. | Retain one declaration after confirming the deployment install/build policy; regenerate `bun.lock`. | **Yes, coupled with dependency group** |
| **Low** | **Standalone `test-*.ts` diagnostics are neither runnable tests nor documented scripts.** Root `test-*.ts`; `package.json:6–12` | They create a false impression of coverage and have no stable setup/assertions. | Either convert the highest-value cases to a test runner or move/manual-label them under `scripts/`. | **Needs decision:** retain diagnostics versus add a test framework. |

## Quick health checks

| Priority | Finding and location | Why it matters | Suggested smallest fix | Approve? |
| --- | --- | --- | --- | --- |
| **High** | **Many optimistic Supabase mutations ignore errors and leave local state as if the write succeeded.** Representative examples: `src/context/DataContext.tsx:559–569,572–583,597–607,610–621,639–649,719–727,730–748,760–801,843–858`. | A failed write can appear successful to the teacher, risking lost or misleading student, schedule, lesson, notification, and AI-content data. | Centralize the existing optimistic-write pattern: check `{ error }`, rollback or mark unsynced on failure, and surface a concise recoverable message. | **Yes — intentional behavior change:** failed saves become visible instead of silent. |
| **Medium** | **Initial data loads discard Supabase errors and fetch complete tables without pagination/column selection.** `src/context/DataContext.tsx:433–479`; admin dashboard `src/components/admin/AdminDashboard.tsx:43–171`. | A failed fetch can silently look like an empty workspace. Data volume, especially the super-admin cross-tenant view, will grow without an upper bound; it also transports more PII than individual screens require. | Check each query error and show a recoverable state. Add deterministic order, select only needed fields, and paginate the list/admin queries. | **Needs product decision:** desired page size and export scope. |
| **Medium** | **Realtime events trigger a full eight-query reload per event.** `src/context/DataContext.tsx:484–499` | Bursts of updates can create redundant network work and visual state churn. | Debounce/coalesce reloads or apply the changed record to the affected in-memory collection. Start with a small debounce to preserve behavior. | **Yes** |
| **Low** | **Quran route parameters are passed upstream without local numeric bounds.** `server.ts:77–83` | This is not a direct SSRF because the host is fixed, but malformed IDs and large `perPage` values create unnecessary upstream requests. | Validate `surahId` and `perPage` as bounded integers before constructing the URL. | **Yes** |

## Recommended Pass 2 sequence

| Group | Proposed work | Expected behavior change |
| --- | --- | --- |
| 1. Security boundary | Validate/bound AI and Quran requests; validate model output; generic errors; private-only server credential; server-side rate limit. | Invalid/oversized requests are rejected; quota may produce 429; bad server configuration fails closed. |
| 2. Privacy decisions | Choose Google-token storage/scope policy and guest-data persistence policy. | Depending on choice, users may reauthorize after refresh or lose guest persistence by default. |
| 3. Dependencies | Apply the compatible patch/minor updates shown above; regenerate `bun.lock`; do **not** apply majors. | No intended application behavior change. |
| 4. Reliability cleanup | Surface/rollback failed writes; visible fetch failures; coalesce realtime reloads. | Failed saves become visible rather than silently appearing saved. |
| 5. Maintainability | Extract the common AI request helper; split server helper; remove duplicate Vite declaration. | No intended application behavior change. |

## Approval requested

Please reply with the groups you want applied. A concise response such as the following is sufficient:

> **Approve groups 1, 3, 4, and 5.** Use a rate limit of **10 AI requests per user per 15 minutes**. Keep Google tokens in session storage for now and retain persistent guest mode.

If you approve the privacy group, please state your choices for Google reauthorization/persistence and guest-mode persistence. I will then make only the approved minimal changes, updating the Bun lockfile for dependency work and building/checking each group before proceeding.

## References

[1]: https://www.npmjs.com/ "npm Registry — package version metadata"
