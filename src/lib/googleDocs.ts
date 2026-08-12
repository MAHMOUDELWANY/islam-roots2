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
export interface LessonDocExportData {
  title: string;
  subject: string;
  level?: string;
  studentName?: string;
  lessonGoal?: string;
  description?: string;
  warmup?: string;
  keyPoints?: string[];
  vocabulary?: Array<{ arabic: string; english: string; explanation: string }> | any[];
  questionsToAsk?: Array<{ question: string; answer?: string; answerKey?: string }> | any[];
  examples?: string[];
  miniActivity?: string;
  quickQuiz?: Array<{ question: string; options?: string[]; correctAnswer?: string; explanation?: string }> | any[];
  homework?: string[] | string;
  teachingTips?: {
    whatToEmphasize?: string;
    commonConfusion?: string;
  } | any;
  notes?: string;
  versesText?: string;
}

/**
 * Creates a beautifully formatted, professional Lesson Plan in Google Docs
 */
export async function exportLessonToGoogleDoc(
  accessToken: string,
  lesson: LessonDocExportData
): Promise<{ documentId: string; webViewLink: string }> {
  const docTitle = `[IslamRoots] ${lesson.subject || 'Lesson'} - ${lesson.title}`;

  // Build clean, publication-ready document layout string
  const lines: string[] = [];

  // Header Banner
  lines.push(`ISLAMROOTS AI EDUCATOR LESSON PLAN`);
  lines.push(`Title: ${lesson.title}`);
  lines.push(`Subject: ${lesson.subject || 'Islamic Studies'} | Level: ${lesson.level || 'General'} | Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push(`Target Group / Student: ${lesson.studentName || 'All Students'}`);
  lines.push(``);

  // 1. LESSON OVERVIEW & GOAL
  lines.push(`1. LESSON OVERVIEW & GOAL`);
  lines.push(lesson.lessonGoal || lesson.description || 'Master key concepts and practical applications.');
  lines.push(``);

  // 2. WARM-UP & OPENING ACTIVITY
  if (lesson.warmup) {
    lines.push(`2. WARM-UP & OPENING ACTIVITY`);
    lines.push(lesson.warmup);
    lines.push(``);
  }

  // 3. KEY POINTS & TAJWEED RULES
  if (lesson.keyPoints && lesson.keyPoints.length > 0) {
    lines.push(`3. KEY POINTS & CORE CONCEPTS`);
    lesson.keyPoints.forEach((kp) => {
      lines.push(`• ${kp}`);
    });
    lines.push(``);
  }

  // 4. VOCABULARY & TERMS
  if (lesson.vocabulary && lesson.vocabulary.length > 0) {
    lines.push(`4. ESSENTIAL VOCABULARY & TAJWEED TERMS`);
    lesson.vocabulary.forEach((v: any) => {
      if (typeof v === 'string') {
        lines.push(`• ${v}`);
      } else {
        const arabicPart = v.arabic ? `${v.arabic} ` : '';
        const engPart = v.english ? `(${v.english})` : '';
        lines.push(`• ${arabicPart}${engPart}: ${v.explanation || ''}`);
      }
    });
    lines.push(``);
  }

  // 5. EXAMPLES & PRACTICAL RECITATIONS
  if (lesson.examples && lesson.examples.length > 0) {
    lines.push(`5. GUIDED EXAMPLES & PRACTICAL RECITATION`);
    lesson.examples.forEach((ex) => {
      lines.push(`• ${ex}`);
    });
    lines.push(``);
  }

  // 6. DISCUSSION & EVALUATION QUESTIONS
  if (lesson.questionsToAsk && lesson.questionsToAsk.length > 0) {
    lines.push(`6. CLASSROOM DISCUSSION QUESTIONS`);
    lesson.questionsToAsk.forEach((q: any, i: number) => {
      if (typeof q === 'string') {
        lines.push(`Q${i + 1}: ${q}`);
      } else {
        lines.push(`Q${i + 1}: ${q.question}`);
        if (q.answer || q.answerKey) {
          lines.push(`   Answer Key: ${q.answer || q.answerKey}`);
        }
      }
    });
    lines.push(``);
  }

  // 7. INTERACTIVE MINI-ACTIVITY
  if (lesson.miniActivity) {
    lines.push(`7. INTERACTIVE MINI-ACTIVITY`);
    lines.push(lesson.miniActivity);
    lines.push(``);
  }

  // 8. QUICK QUIZ & CHECKPOINT
  if (lesson.quickQuiz && lesson.quickQuiz.length > 0) {
    lines.push(`8. CHECKPOINT QUIZ`);
    lesson.quickQuiz.forEach((qz: any, i: number) => {
      lines.push(`${i + 1}. ${qz.question}`);
      if (qz.options && Array.isArray(qz.options)) {
        qz.options.forEach((opt: string, oIdx: number) => {
          lines.push(`   [${String.fromCharCode(65 + oIdx)}] ${opt}`);
        });
      }
      if (qz.correctAnswer) {
        lines.push(`   Correct Answer: ${qz.correctAnswer}`);
      }
      if (qz.explanation) {
        lines.push(`   Explanation: ${qz.explanation}`);
      }
      lines.push(``);
    });
  }

  // 9. HOMEWORK & ASSIGNMENTS
  if (lesson.homework) {
    lines.push(`9. HOMEWORK & PRACTICE ASSIGNMENT`);
    if (Array.isArray(lesson.homework)) {
      lesson.homework.forEach((hw) => lines.push(`• ${hw}`));
    } else {
      lines.push(lesson.homework);
    }
    lines.push(``);
  }

  // 10. TEACHER NOTES & TIPS
  if (lesson.teachingTips || lesson.notes) {
    lines.push(`10. USTADH TEACHING GUIDANCE & TIPS`);
    if (typeof lesson.teachingTips === 'object') {
      if (lesson.teachingTips.whatToEmphasize) {
        lines.push(`• Key Focus: ${lesson.teachingTips.whatToEmphasize}`);
      }
      if (lesson.teachingTips.commonConfusion) {
        lines.push(`• Common Confusion / Warning: ${lesson.teachingTips.commonConfusion}`);
      }
    } else if (lesson.teachingTips) {
      lines.push(String(lesson.teachingTips));
    }
    if (lesson.notes) {
      lines.push(lesson.notes);
    }
    lines.push(``);
  }

  lines.push(`--------------------------------------------------`);
  lines.push(`IslamRoots AI Educator Network • https://islamroots.app`);

  const fullText = lines.join('\n');
  const result = await createGoogleDoc(accessToken, docTitle, fullText);
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
