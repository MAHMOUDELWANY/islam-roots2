# Generate Lesson Root-Cause and Repair Record

## Root cause

The production failure occurred after the authenticated request reached `POST /api/gemini/lesson-plan` and passed the existing request validation. Vercel runtime logs recorded a Gemini HTTP 404 with the provider message that `models/gemini-2.5-flash` was no longer available to new users. The server then converted that provider exception into the generic response `The request could not be completed. Please try again.`, which prevented the UI from identifying the actual model/configuration failure.

The live Gemini catalog was queried from the configured account. It exposed `gemini-3.5-flash`, `gemini-3.5-flash-lite`, and `gemini-flash-latest`; a direct structured-output probe against `gemini-3.5-flash` returned HTTP 200. The repair therefore uses an allowlisted stable candidate with a safe `gemini-3.5-flash` fallback, rather than inventing a model name.

## Pipeline findings

| Stage | Finding | Repair |
|---|---|---|
| Generate button and form | The UI allowed an arbitrary name and manual defaults, even when no real student was selected. | The handler now requires a selected student, valid topic, assigned subject, completed level, and matching curriculum. |
| Request payload | Client profile and history were sent directly and did not include an explicit student or curriculum identity. | The payload now includes `studentId`, `curriculumId`, and explicit context. |
| Authentication | The route already required a Supabase bearer session. | The boundary is preserved; missing auth remains a non-sensitive auth category. |
| Student/curriculum data | The server did not verify ownership or assignment before calling Gemini. | The server now reads the selected student, curriculum assignment, curriculum metadata, and up to eight real lesson sessions through the server-only Supabase admin boundary. |
| Gemini configuration | The fallback model was `gemini-2.5-flash`, which caused the observed production 404. | The server uses an allowlist containing verified available models and falls back to `gemini-3.5-flash`. Startup diagnostics report only selected model and configuration presence, never secrets. |
| Prompt | The prompt had good level/focus instructions but used client-provided identity/history. | The prompt now uses server-verified student data and real evidence only, explicitly treating empty history as no prior evidence. |
| Output schema | The schema guaranteed the earlier lesson fields but not explicit objectives, guided/student practice, assessment, differentiated activities, or timing. | The deterministic schema and runtime validator now require all complete-plan fields. |
| Parsing and retry | JSON parsing could fail into the generic server error. | The route strips simple code fences, validates structure, then performs one deterministic retry before returning `SCHEMA_ERROR`. |
| Error UX | The client displayed raw/generic fallback text. | The client maps safe categories for validation, auth, timeout, model, provider, database, schema, and server failures; technical category suffixes appear only in development. |
| Library save | Autosave failures were logged but silent. | Existing save flow is preserved, with a visible localized `SAVE_ERROR` toast on failure. |

## Verification evidence

The strict validation test rejected missing student identity, invalid subject, invalid student level, and invalid curriculum context, while accepting a valid request with empty evidence history. The live complete-plan Gemini probe using `gemini-3.5-flash` returned all 18 required top-level fields, included the requested Ayn/Qaf focus, produced a timing total, and returned beginner differentiation. The local API boundary returned HTTP 200 for health and safely rejected a protected lesson request when Supabase admin configuration was unavailable.

No API keys, tokens, student records, provider prompts, or model-generated lesson content are committed in this record.

## External verification sources

The live Gemini model catalog was checked through the official endpoint [`https://generativelanguage.googleapis.com/v1beta/models`](https://generativelanguage.googleapis.com/v1beta/models). The repaired production deployment was verified at [`https://islam-roots-b9n9zb3px-islam-roots.vercel.app/`](https://islam-roots-b9n9zb3px-islam-roots.vercel.app/), which returned HTTP 200 for the public HTML smoke check. The deployment corresponds to GitHub commit `00b13e2c1d906eca203d75f8822b254758af2b7e`.
