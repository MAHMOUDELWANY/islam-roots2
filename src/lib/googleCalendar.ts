import { throwForGoogleResponse } from "./googleWorkspace";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  status?: string;
}

export interface GoogleCalendarWriteEvent {
  title: string;
  description?: string;
  startTimeISO: string;
  durationMinutes: number;
  studentName?: string;
  subject?: string;
  recurrence?: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  recurrenceDays?: number[];
  recurrenceEndDate?: string;
  timeZone?: string;
}

/**
 * Writes an Islam Roots schedule to the educator's primary Google Calendar.
 * This module intentionally has no list/read/delete helpers: the product only
 * synchronizes events created in Islam Roots and never imports personal events.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: GoogleCalendarWriteEvent,
): Promise<GoogleCalendarEvent> {
  const startDate = new Date(event.startTimeISO);
  const endDate = new Date(startDate.getTime() + event.durationMinutes * 60 * 1000);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid schedule date");
  }

  const dayCodes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const selectedDays = event.recurrenceDays?.length
    ? event.recurrenceDays.map((day) => dayCodes[day]).filter(Boolean)
    : [dayCodes[startDate.getDay()]];
  const frequency = event.recurrence === "biweekly"
    ? "WEEKLY"
    : event.recurrence === "monthly"
      ? "MONTHLY"
      : event.recurrence === "daily"
        ? "DAILY"
        : event.recurrence === "weekly"
          ? "WEEKLY"
          : null;
  const recurrenceRule = frequency
    ? `RRULE:FREQ=${frequency}${event.recurrence === "biweekly" ? ";INTERVAL=2" : ""}${frequency === "WEEKLY" ? `;BYDAY=${selectedDays.join(",")}` : ""}${event.recurrenceEndDate ? `;UNTIL=${new Date(`${event.recurrenceEndDate}T23:59:59Z`).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}` : ""}`
    : undefined;

  const body = {
    summary: event.title,
    description: event.description || `IslamRoots Ustadh Session with ${event.studentName || "Student"} (${event.subject || "Lesson"})`,
    ...(recurrenceRule ? { recurrence: [recurrenceRule] } : {}),
    start: { dateTime: startDate.toISOString(), ...(event.timeZone ? { timeZone: event.timeZone } : {}) },
    end: { dateTime: endDate.toISOString(), ...(event.timeZone ? { timeZone: event.timeZone } : {}) },
    // Keep reminders private to the connected calendar; do not send email notifications.
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 15 }],
    },
    extendedProperties: {
      private: {
        islamRootsManaged: "true",
      },
    },
  };

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=none", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await throwForGoogleResponse(response, "Google Calendar event creation");
  }

  return await response.json() as GoogleCalendarEvent;
}
