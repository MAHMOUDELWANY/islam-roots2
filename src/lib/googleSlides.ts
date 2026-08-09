export interface GoogleSlideFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
  iconLink?: string;
}

export interface SlideContent {
  title: string;
  subtitle?: string;
  bodyPoints?: string[];
  notes?: string;
}

/**
 * Creates a new Google Slides presentation with structured slides.
 */
export async function createGoogleSlidesPresentation(
  accessToken: string,
  title: string,
  slides: SlideContent[]
): Promise<{ presentationId: string; title: string; webViewLink: string }> {
  try {
    // 1. Create a blank presentation
    const response = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to create Google Slides presentation:', errText);
      throw new Error(`Google Slides API error (${response.status})`);
    }

    const presData = await response.json();
    const presentationId = presData.presentationId;
    const webViewLink = `https://docs.google.com/presentation/d/${presentationId}/edit`;

    // 2. Populate presentation with slides if provided
    if (slides && slides.length > 0) {
      const requests: any[] = [];

      slides.forEach((slide, index) => {
        const slideObjectId = `slide_${index + 1}_${Date.now()}`;
        const titleObjectId = `title_${index + 1}_${Date.now()}`;
        const bodyObjectId = `body_${index + 1}_${Date.now()}`;

        // Request to create slide with Title and Body layout
        requests.push({
          createSlide: {
            objectId: slideObjectId,
            insertionIndex: index,
            slideLayout: {
              predefinedLayout: index === 0 ? 'TITLE' : 'TITLE_AND_BODY',
            },
            placeholderIdMappings: [
              {
                layoutPlaceholder: {
                  type: index === 0 ? 'TITLE' : 'TITLE',
                  index: 0,
                },
                objectId: titleObjectId,
              },
              {
                layoutPlaceholder: {
                  type: index === 0 ? 'SUBTITLE' : 'BODY',
                  index: 0,
                },
                objectId: bodyObjectId,
              },
            ],
          },
        });

        // Request to insert title text
        if (slide.title) {
          requests.push({
            insertText: {
              objectId: titleObjectId,
              text: slide.title,
            },
          });
        }

        // Request to insert body/subtitle text
        const bodyText = index === 0
          ? slide.subtitle || ''
          : (slide.bodyPoints || []).map((pt) => `• ${pt}`).join('\n');

        if (bodyText) {
          requests.push({
            insertText: {
              objectId: bodyObjectId,
              text: bodyText,
            },
          });
        }
      });

      // Send batchUpdate if requests exist
      if (requests.length > 0) {
        const batchUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
        const batchResponse = await fetch(batchUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        });

        if (!batchResponse.ok) {
          const batchErr = await batchResponse.text();
          console.warn('Batch update for Google Slides partially failed:', batchErr);
        }
      }
    }

    return {
      presentationId,
      title: presData.title || title,
      webViewLink,
    };
  } catch (err) {
    console.error('Error creating Google Slides presentation:', err);
    throw err;
  }
}

/**
 * Exports an AI Jalilah Lesson Plan into a multi-slide Google Slides presentation deck.
 */
export async function exportLessonToGoogleSlides(
  accessToken: string,
  lesson: {
    title: string;
    subject: string;
    level?: string;
    description?: string;
    keyPoints?: string[];
    vocabulary?: Array<{ arabic: string; english: string; explanation: string }>;
    teachingTips?: string;
  }
): Promise<{ presentationId: string; webViewLink: string }> {
  const presTitle = `[IslamRoots Deck] ${lesson.subject} - ${lesson.title}`;

  const slides: SlideContent[] = [
    {
      title: lesson.title,
      subtitle: `Subject: ${lesson.subject} | Level: ${lesson.level || 'General'}\nIslamRoots Ustadh Interactive Deck`,
    },
    {
      title: 'Lesson Overview & Objectives',
      bodyPoints: [
        lesson.description || 'Interactive Quranic lesson plan.',
        'Objective: Master rules and application through guided recitation.',
      ],
    },
  ];

  if (lesson.keyPoints && lesson.keyPoints.length > 0) {
    slides.push({
      title: 'Key Concepts & Tajweed Rules',
      bodyPoints: lesson.keyPoints,
    });
  }

  if (lesson.vocabulary && lesson.vocabulary.length > 0) {
    slides.push({
      title: 'Essential Terms & Vocabulary',
      bodyPoints: lesson.vocabulary.map(
        (v) => `${v.arabic} (${v.english}) — ${v.explanation}`
      ),
    });
  }

  if (lesson.teachingTips) {
    slides.push({
      title: 'Ustadh Teaching Guidance & Recitation Tips',
      bodyPoints: [lesson.teachingTips],
    });
  }

  const result = await createGoogleSlidesPresentation(
    accessToken,
    presTitle,
    slides
  );

  return {
    presentationId: result.presentationId,
    webViewLink: result.webViewLink,
  };
}

/**
 * Fetch Google Slides presentations created or stored in user's Google Drive.
 */
export async function fetchUserGoogleSlides(
  accessToken: string
): Promise<GoogleSlideFile[]> {
  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append(
      'q',
      "mimeType='application/vnd.google-apps.presentation' and trashed=false"
    );
    url.searchParams.append('orderBy', 'modifiedTime desc');
    url.searchParams.append('pageSize', '20');
    url.searchParams.append(
      'fields',
      'files(id, name, webViewLink, modifiedTime, iconLink)'
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Failed to list Google Slides presentations:', errText);
      throw new Error(`Google Drive API Error (${response.status})`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error fetching Google Slides presentations:', err);
    throw err;
  }
}

/**
 * Delete a Google Slides presentation from Google Drive
 */
export async function deleteGoogleSlide(
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
      console.error('Failed to delete Google Slides presentation:', errText);
      throw new Error(`Google Drive API error (${response.status})`);
    }

    return true;
  } catch (err) {
    console.error('Error deleting Google Slides presentation:', err);
    throw err;
  }
}
