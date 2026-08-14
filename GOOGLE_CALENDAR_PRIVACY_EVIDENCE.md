
# Google Calendar Privacy Evidence

Google’s official Calendar scope guidance lists `https://www.googleapis.com/auth/calendar.events` as allowing an app to **view and edit events on all calendars**, while narrower app-created-calendar scope options also exist. The current Islam Roots implementation requests `calendar.events` and calls `GET /calendar/v3/calendars/primary/events` through `fetchGoogleCalendarEvents`, which returns upcoming events from the educator’s primary calendar. Google’s official `events.list` reference confirms that `calendarId=primary` returns events on the specified primary calendar and supports broad result listing. The privacy-preserving product decision is to remove the in-app list/import view and all event deletion of Google-owned events, while retaining only explicit one-way writes for schedules created in Islam Roots.

References:

- https://developers.google.com/workspace/calendar/api/auth — Choose Google Calendar API scopes.
- https://developers.google.com/workspace/calendar/api/v3/reference/events/list — Events: list.

## Implementation decisions

- Remove the `google` view mode, `events.list` fetch, imported-event cards, and deletion of Google-owned events from the schedule UI.
- Keep Google Calendar authorization limited to the existing event-edit scope and use it only for explicit event creation for schedules created in Islam Roots.
- Make schedule creation await the Google write, show a localized success/failure status, and leave the local schedule saved even if Google authorization or insertion fails.
- Rename the schedule-card action from a generic share icon to an explicit synchronization action and make it call the same awaited Google event creation path.
- Persist Jalilah Studio drafts synchronously in `sessionStorage` so browser backgrounding, split-screen lifecycle changes, or a same-tab reload can restore the current generated plan and inputs without placing lesson content in long-lived `localStorage`.
