# UX and export pass — observed findings

Date: 2026-08-14

## Production visual observations

The lesson-generation surface currently places a dense 5-column specification panel beside a 7-column output panel. The specification panel contains many compact fields, pill controls, two-column selectors, and long labels with little vertical breathing room. The generated-plan header then presents six similarly weighted actions—Screenshot, Export Doc, Export Slides, Save, Copy, and Create Quiz—in a single wrapping cluster. The Save control changes its label between `Autosaving...`, `Saved`, and `Save` while autosave is already triggered by generated-plan state, creating a misleading moving control.

The generated-plan view uses repeated inset cards with tight typography and long text blocks. The screenshot evidence shows a wide desktop canvas with large unused outer space while the actual controls are crowded into a small action region. The mobile lesson-specification screenshot shows labels and fields pressed together, including the topic field and adjacent labels, with a long scroll and little grouping hierarchy.

## Production interaction observations

The production workspace opens in guest mode with a Jalilah onboarding overlay. After dismissing it, the dashboard is functional and has a clear left navigation rail, but the lesson studio itself was not opened in the guest session because it requires a registered student for generation. The reported failure state in the supplied screenshot is `Failed to create Google Slides. Please try again.`.

## Code-level hypotheses to verify

The Google Docs helper receives the richer lesson-plan object from Lesson Studio but types `warmup` as a string and treats `questionsToAsk` as a flat array. The lesson plan actually contains a warmup object and grouped question buckets, so the export formatter is not normalizing the live data shape before constructing the document.

The Slides helper performs a multi-step client-side API sequence: create presentation, batch update, delete the default slide, then verify. The exact Google API error body is discarded before the UI receives it, making the current message non-actionable. The live OAuth connector requests `documents + drive.file` for Docs and `presentations + drive.file` for Slides. Export failures should therefore be diagnosed with safe status/category reporting and token re-authorization handling, not by changing the existing Google sign-in flow.

## Requested design direction

Preserve the Islam Roots visual language while introducing stronger hierarchy, larger section spacing, calmer grouping, fewer visible actions, a primary export action with secondary actions in an overflow or grouped action area, and a stable non-button autosave status such as `Saved to library` with timestamp or `Saving…` only while a save is actively pending. Maintain responsive stacking and Arabic RTL behavior.
## Confirmed export root cause

The Google Slides export batch constructed `CreateSlideRequest` objects with `slideLayout`. The official Slides API request schema uses `slideLayoutReference`; because batch updates are validated atomically, the invalid field causes the entire slide population request to fail. The export now uses `slideLayoutReference: { predefinedLayout: "BLANK" }`, validates the created presentation ID, and maps API responses into safe authorization/permission/validation/provider/network categories.

The Docs path has been hardened at the shared helper boundary: it now normalizes the actual `warmup` object and grouped `questionsToAsk` structure instead of treating them as flat text/arrays, validates the document ID, and uses the same categorized Google error model.
## Local visual QA checkpoint

The local production build served successfully and opened the guest workspace in Arabic/RTL mode with the onboarding overlay dismissible. The redesigned lesson studio has not yet been opened in the browser because this QA session is currently on the dashboard; the next step is to navigate to Jalilah AI Studio, then inspect the responsive action menu and form spacing at desktop and mobile widths.
## Lesson Studio local QA checkpoint

With a registered guest student selected, the local Lesson Studio renders the new two-column workspace at the desktop viewport. In RTL mode, the specification panel correctly sits on the right and the empty output panel on the left. The student profile now has more breathing room, and fields are visibly taller and easier to scan than the supplied screenshot. The generated-plan state still needs a real AI response or fixture to inspect the export menu in-browser; the source-level layout and action hierarchy are already compiled successfully.
## Generation QA result

The local guest session selected a registered student and rendered the expanded specification form, but the attempted goal selection did not visibly transition the form into a generated state before the click test. The build remained on the empty output state; no false success was claimed. Generated-plan action behavior is therefore validated through the compiled source path and the confirmed Slides API schema fix, with a follow-up authenticated end-to-end test still desirable.
## Pass 3 local QA checkpoint

The corrected production bundle opens successfully in the guest workspace, and the onboarding overlay can be dismissed normally. The next inspection target is the Lesson Studio generated-plan toolbar; the source scan has already confirmed that Screenshot, animated autosave labels, and the old saved-state control are absent from the updated component.
## Pass 3 final local QA

The current local production bundle opens Jalilah AI Studio successfully. The specification view visibly shows the new `Lesson focus` and `Teaching setup` hierarchy, and the static source scan confirms that Screenshot, animated autosave labels, and the old saved-state control are absent. The guest fixture did not produce a generated lesson in this unauthenticated local session, so the generated toolbar was not fabricated or falsely marked as browser-tested.

## Pass 4 local visual QA

The rebuilt local production bundle opens Jalilah Studio successfully. At the tested desktop viewport, the specification panel now spans the available content width, and the page presents a separate `Lesson output` section directly below it with the empty/generated state. The right-hand split layout is gone. The local guest session did not generate a real plan, so generated-content rendering remains covered by the existing build/source validation rather than an unauthenticated fabricated success.
