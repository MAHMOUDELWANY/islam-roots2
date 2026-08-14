# Google export API evidence

These official references were consulted during the export diagnosis:

1. Google Slides `presentations.batchUpdate`: https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/batchUpdate
   - Batch updates are validated before application and are atomic: if one request is invalid, the entire batch fails.
   - The required OAuth scopes include `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/presentations`.

2. Google Slides `presentations.create`: https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/create
   - Creates a blank presentation using the supplied title.
   - The required OAuth scopes include `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/presentations`.

3. Google Slides request schema: https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/request#CreateSlideRequest
   - `CreateSlideRequest` uses `slideLayoutReference`, not `slideLayout`.
   - When no layout reference is supplied, the API uses the predefined `BLANK` layout.

4. Google Docs `documents.create`: https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/create
   - Creates a blank document with the supplied title.
   - The required OAuth scopes include `https://www.googleapis.com/auth/documents` and `https://www.googleapis.com/auth/drive.file`.

5. Google OAuth 2.0 overview: https://developers.google.com/identity/protocols/oauth2
   - Access tokens are limited to granted scopes.
   - Applications should examine granted scopes and request additional permissions incrementally when a feature is used.

Confirmed repository defect: the previous Slides export sent `slideLayout`, which is not the official `CreateSlideRequest` field. Because `batchUpdate` is atomic, that malformed request explains the reported `Failed to create Google Slides` state. The implementation now sends `slideLayoutReference: { predefinedLayout: "BLANK" }` and preserves the existing incremental OAuth scopes.

## Pass 3 rejection evidence

The live Google Slides discovery schema confirms that `ParagraphStyle.alignment` accepts `ALIGNMENT_UNSPECIFIED`, `START`, `CENTER`, `END`, and `JUSTIFIED`. The previous export builder sent `LEFT` and `RIGHT`, which are not valid enum values for this field and can cause the atomic `batchUpdate` request to be rejected with HTTP 400. The builder now sends `START` for left-to-right content and `END` for right-to-left content, while keeping `LEFT_TO_RIGHT` and `RIGHT_TO_LEFT` for the separate `direction` field.

Reference: https://slides.googleapis.com/$discovery/rest?version=v1
