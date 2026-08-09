export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  status?: string;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMinISO?: string
): Promise<GoogleCalendarEvent[]> {
  try {
    const timeMin = timeMinISO || new Date().toISOString();
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', timeMin);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('maxResults', '20');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to fetch Google Calendar events:', errText);
      throw new Error(`Google Calendar API Error (${response.status})`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('Error fetching Google Calendar events:', err);
    throw err;
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    startTimeISO: string;
    durationMinutes: number;
    studentName?: string;
    subject?: string;
  }
): Promise<GoogleCalendarEvent> {
  try {
    const startDate = new Date(event.startTimeISO);
    const endDate = new Date(startDate.getTime() + event.durationMinutes * 60 * 1000);

    const body = {
      summary: event.title,
      description: event.description || `IslamRoots Ustadh Session with ${event.studentName || 'Student'} (${event.subject || 'Lesson'})`,
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 30 },
        ],
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to create Google Calendar event:', errText);
      throw new Error(`Google Calendar API error (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error creating Google Calendar event:', err);
    throw err;
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errText = await response.text();
      console.error('Failed to delete Google Calendar event:', errText);
      throw new Error(`Google Calendar API error (${response.status})`);
    }

    return true;
  } catch (err) {
    console.error('Error deleting Google Calendar event:', err);
    throw err;
  }
}
