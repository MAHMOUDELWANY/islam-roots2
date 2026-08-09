export interface GoogleForm {
  formId: string;
  responderUri: string;
  title: string;
}

/**
 * Create a Google Form (e.g. Quiz or Feedback Form) via Google Forms API
 */
export async function createGoogleQuizForm(
  accessToken: string,
  title: string,
  questions: Array<{ title: string; options?: string[] }>
): Promise<GoogleForm> {
  try {
    // 1. Create form
    const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title,
          documentTitle: title,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Failed to create Google Form:', err);
      throw new Error(`Google Forms API error (${createRes.status})`);
    }

    const formData = await createRes.json();
    const formId = formData.formId;

    // 2. Add questions
    if (questions && questions.length > 0) {
      const requests = questions.map((q, idx) => ({
        createItem: {
          item: {
            title: q.title,
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: q.options && q.options.length > 0 ? 'RADIO' : 'TEXT',
                  options: q.options
                    ? q.options.map((opt) => ({ value: opt }))
                    : undefined,
                },
              },
            },
          },
          location: { index: idx },
        },
      }));

      const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (!batchRes.ok) {
        const batchErr = await batchRes.text();
        console.warn('Batch update for Google Form questions warned:', batchErr);
      }
    }

    return {
      formId,
      responderUri: formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
      title: formData.info?.title || title,
    };
  } catch (err) {
    console.error('Error creating Google Form:', err);
    throw err;
  }
}
