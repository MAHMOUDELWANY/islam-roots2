export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
}

/**
 * Fetch Google Tasks list for the authenticated user
 */
export async function fetchGoogleTasks(accessToken: string): Promise<GoogleTask[]> {
  try {
    const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Failed to fetch Google Tasks:', err);
      throw new Error(`Google Tasks API Error (${response.status})`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      notes: item.notes,
      due: item.due,
      status: item.status,
    }));
  } catch (err) {
    console.error('Error fetching Google Tasks:', err);
    throw err;
  }
}

/**
 * Create a new task (e.g. Student Assignment/Homework) in Google Tasks
 */
export async function createGoogleTask(
  accessToken: string,
  title: string,
  notes?: string,
  dueDateIso?: string
): Promise<GoogleTask> {
  try {
    const body: any = { title };
    if (notes) body.notes = notes;
    if (dueDateIso) body.due = dueDateIso;

    const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Failed to create Google Task:', err);
      throw new Error(`Google Tasks API Error (${response.status})`);
    }

    const item = await response.json();
    return {
      id: item.id,
      title: item.title,
      notes: item.notes,
      due: item.due,
      status: item.status,
    };
  } catch (err) {
    console.error('Error creating Google Task:', err);
    throw err;
  }
}
