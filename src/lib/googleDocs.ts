export interface GoogleDocFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
  iconLink?: string;
}

/**
 * Creates a new blank Google Document or populates it with text content.
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  initialText?: string
): Promise<{ documentId: string; title: string; webViewLink: string }> {
  try {
    // 1. Create blank doc
    const response = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to create Google Doc:', errText);
      throw new Error(`Google Docs API error (${response.status})`);
    }

    const docData = await response.json();
    const documentId = docData.documentId;
    const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;

    // 2. Insert text if provided
    if (initialText && initialText.trim()) {
      await insertTextIntoDoc(accessToken, documentId, initialText.trim());
    }

    return {
      documentId,
      title: docData.title || title,
      webViewLink,
    };
  } catch (err) {
    console.error('Error creating Google Doc:', err);
    throw err;
  }
}

/**
 * Helper to insert text at start of a Google Doc using batchUpdate
 */
export async function insertTextIntoDoc(
  accessToken: string,
  documentId: string,
  text: string
): Promise<void> {
  const batchUrl = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
  const response = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: text,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to insert text into Google Doc:', errText);
    throw new Error(`Google Docs BatchUpdate error (${response.status})`);
  }
}

/**
 * Creates a formatted Lesson Plan or Tajweed Guide in Google Docs
 */
export async function exportLessonToGoogleDoc(
  accessToken: string,
  lesson: {
    title: string;
    subject: string;
    studentName?: string;
    description?: string;
    versesText?: string;
    notes?: string;
    homework?: string;
  }
): Promise<{ documentId: string; webViewLink: string }> {
  const docTitle = `[IslamRoots] Lesson Plan - ${lesson.title}`;
  
  const formattedContent = [
    `ISLAMROOTS USTADH LESSON PLAN`,
    `=====================================`,
    `Lesson Title: ${lesson.title}`,
    `Subject: ${lesson.subject}`,
    `Student: ${lesson.studentName || 'All Students'}`,
    `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    ``,
    `LESSON OVERVIEW & OBJECTIVES:`,
    `-------------------------------------`,
    lesson.description || 'No detailed overview provided.',
    ``,
    `QURAN / TAJWEED VERSES & REFERENCE:`,
    `-------------------------------------`,
    lesson.versesText || 'None specified.',
    ``,
    `TEACHER NOTES & GUIDANCE:`,
    `-------------------------------------`,
    lesson.notes || 'N/A',
    ``,
    `HOMEWORK & ASSIGNMENT:`,
    `-------------------------------------`,
    lesson.homework || 'No homework assigned.',
    ``,
    `-- Generated via IslamRoots Platform --`,
  ].join('\n');

  const result = await createGoogleDoc(accessToken, docTitle, formattedContent);
  return {
    documentId: result.documentId,
    webViewLink: result.webViewLink,
  };
}

/**
 * Fetch Google Docs created or accessed in user's Google Drive
 */
export async function fetchUserGoogleDocs(
  accessToken: string
): Promise<GoogleDocFile[]> {
  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('q', "mimeType='application/vnd.google-apps.document' and trashed=false");
    url.searchParams.append('orderBy', 'modifiedTime desc');
    url.searchParams.append('pageSize', '20');
    url.searchParams.append('fields', 'files(id, name, webViewLink, modifiedTime, iconLink)');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to list Google Docs:', errText);
      throw new Error(`Google Drive API Error (${response.status})`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error fetching Google Docs:', err);
    throw err;
  }
}

/**
 * Delete a Google Doc file from Google Drive
 */
export async function deleteGoogleDoc(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errText = await response.text();
      console.error('Failed to delete Google Doc:', errText);
      throw new Error(`Google Drive API error (${response.status})`);
    }

    return true;
  } catch (err) {
    console.error('Error deleting Google Doc:', err);
    throw err;
  }
}
