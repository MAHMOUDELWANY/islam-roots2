# Islam Roots Visual Polish QA

## Scope

This QA pass covers the attached advanced visual-polish requirements over the existing Islam Roots product. The review intentionally preserves the existing routes, authentication, guest session behavior, AI boundaries, Google integrations, and data contracts.

## Checks completed

| Surface | State | Result |
|---|---|---|
| Public landing page | English, desktop | Hero hierarchy, deeper olive actions, compliance panel, feature cards, preview tabs, CTA, and footer render with the restored Tailwind utility layer and shared surface recipes. |
| Public landing page | Arabic, desktop RTL | Navigation mirrors correctly, Arabic hero type wraps cleanly, CTA order is intentional, compliance and Google Workspace copy is localized, and the olive/sand palette remains coherent. |
| Landing scroll narrative | Normal motion | `MotionReveal` sections enter through opacity/translate transitions and do not animate layout dimensions. The trigger begins before the next section enters the viewport to avoid blank transitions. |
| Authenticated workspace | Arabic guest dashboard | Sidebar, sticky header, evidence-gated dashboard, quick actions, and empty states preserve the established product behavior while using the refined olive shell. |
| Settings | Arabic guest workspace | Profile fields, language/theme controls, Google connection cards, legal links, demo controls, two-column composition, and RTL wrapping are readable. Google cards use two columns at wider widths to avoid compressed copy. |
| Typography | Source scan | No remaining `italic` utility is used for headings or explanatory UI copy. `not-italic` remains only where it explicitly protects a badge or identity label. |
| Focus and reduced motion | Source/CSS review | Shared focus-visible ring and `prefers-reduced-motion` safeguards remain active. New motion uses opacity/transform transitions only. |
| Build and security | Local release suite | TypeScript, production build, Bun audit, whitespace check, and secret-pattern scan pass. Expected environment-variable names appear only in `.env.example`, server code, and test helpers; no secret values were found. |

## Known limitations

The browser preview is a local production-style server review rather than a full device farm. The current browser session visibly covered desktop-width English and Arabic states plus the authenticated Arabic guest dashboard and Settings surface. Tablet and mobile behavior is addressed through the responsive class changes and should receive a final manual check after deployment if a real device-specific issue appears.

The Manim skill was not used to create an MP4 because the requirement concerns in-product interface motion rather than a standalone explanatory animation. The online supporting-skill search was attempted against the verified index; the online request fell back to cached data and returned no relevant match, so no unverified external skill guidance was introduced.
