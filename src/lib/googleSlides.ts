export interface GoogleSlideFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
  iconLink?: string;
}

import { GoogleWorkspaceError, throwForGoogleResponse, toGoogleWorkspaceError } from "./googleWorkspace";

export interface SlideContent {
  title: string;
  subtitle?: string;
  bodyPoints?: string[];
  notes?: string;
}

export function containsArabic(text: string): boolean {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

/**
 * Normalizes raw lesson plan data into a structured multi-slide presentation deck.
 */
export function normalizeLessonPlanToSlides(
  lesson: any,
  subject: string,
  topic: string,
  level?: string
): SlideContent[] {
  console.log('[SLIDES_CONTENT_NORMALIZED] Normalizing lesson plan data into slide deck structure');

  const slides: SlideContent[] = [];

  const mainTitle = topic || lesson?.title || `${subject || 'Islamic Studies'} Lesson`;
  const isAr = containsArabic(mainTitle) || containsArabic(subject || '');

  // 1. Title Slide
  slides.push({
    title: mainTitle,
    subtitle: `${isAr ? 'المادة' : 'Subject'}: ${subject || 'Islamic Studies'} | ${isAr ? 'المستوى' : 'Level'}: ${level || (isAr ? 'عام' : 'General')}\nIslamRoots Educator Interactive Deck`,
  });

  // 2. Goal / Overview
  const goalText = lesson?.lessonGoal || lesson?.description;
  if (goalText) {
    slides.push({
      title: isAr ? 'أهداف الدرس والغرض' : 'Lesson Goal & Overview',
      bodyPoints: [
        goalText,
        isAr
          ? 'الهدف: إتقان المفاهيم والتطبيقات من خلال الممارسة الموجهة والترديد.'
          : 'Objective: Master concepts and application through guided recitation and practice.',
      ],
    });
  }

  // 3. Warm-up
  if (lesson?.warmup) {
    const warmupPts: string[] = [];
    if (lesson.warmup.durationMinutes) {
      warmupPts.push(`${isAr ? 'المدة' : 'Duration'}: ${lesson.warmup.durationMinutes} ${isAr ? 'دقائق' : 'minutes'}`);
    }
    if (lesson.warmup.instructions) {
      warmupPts.push(`${isAr ? 'التعليمات' : 'Instructions'}: ${lesson.warmup.instructions}`);
    }
    if (Array.isArray(lesson.warmup.questions) && lesson.warmup.questions.length > 0) {
      warmupPts.push(`${isAr ? 'أسئلة التمهيد' : 'Warm-up Questions'}:`);
      lesson.warmup.questions.forEach((q: string) => warmupPts.push(`• ${q}`));
    }
    if (warmupPts.length > 0) {
      slides.push({
        title: isAr ? 'التهيئة والتمهيد' : 'Warm-Up & Initial Activation',
        bodyPoints: warmupPts,
      });
    }
  }

  // 4. Key Points / Rules
  if (Array.isArray(lesson?.keyPoints) && lesson.keyPoints.length > 0) {
    slides.push({
      title: isAr ? 'المفاهيم والقواعد الرئيسية' : 'Key Concepts & Rules',
      bodyPoints: lesson.keyPoints,
    });
  }

  // 5. Vocabulary
  if (Array.isArray(lesson?.vocabulary) && lesson.vocabulary.length > 0) {
    const vocabPts = lesson.vocabulary.map((v: any) => {
      if (typeof v === 'string') return v;
      const arTerm = v.arabic || '';
      const enTerm = v.english ? `(${v.english})` : '';
      const exp = v.explanation ? ` — ${v.explanation}` : '';
      const pron = v.pronunciation ? ` [${v.pronunciation}]` : '';
      return `${arTerm} ${enTerm}${pron}${exp}`.trim();
    });
    slides.push({
      title: isAr ? 'المفردات والمصطلحات' : 'Essential Terms & Vocabulary',
      bodyPoints: vocabPts,
    });
  }

  // 6. Guided Examples
  if (Array.isArray(lesson?.examples) && lesson.examples.length > 0) {
    slides.push({
      title: isAr ? 'الأمثلة والتطبيقات' : 'Guided Examples & Practice',
      bodyPoints: lesson.examples,
    });
  }

  // 7. Discussion Questions
  if (lesson?.questionsToAsk) {
    const qPts: string[] = [];
    if (Array.isArray(lesson.questionsToAsk.easy) && lesson.questionsToAsk.easy.length > 0) {
      qPts.push(`${isAr ? 'مستوى مبتدئ' : 'Easy'}: ${lesson.questionsToAsk.easy.join(' | ')}`);
    }
    if (Array.isArray(lesson.questionsToAsk.medium) && lesson.questionsToAsk.medium.length > 0) {
      qPts.push(`${isAr ? 'مستوى متوسط' : 'Medium'}: ${lesson.questionsToAsk.medium.join(' | ')}`);
    }
    if (Array.isArray(lesson.questionsToAsk.challenge) && lesson.questionsToAsk.challenge.length > 0) {
      qPts.push(`${isAr ? 'مستوى متقدم' : 'Challenge'}: ${lesson.questionsToAsk.challenge.join(' | ')}`);
    }
    if (qPts.length > 0) {
      slides.push({
        title: isAr ? 'أسئلة المناقشة والتقويم' : 'Discussion & Checkpoint Questions',
        bodyPoints: qPts,
      });
    }
  }

  // 8. Mini Activity
  if (lesson?.miniActivity) {
    slides.push({
      title: isAr ? 'نشاط تفاعلي' : 'Interactive Mini Activity',
      bodyPoints: [lesson.miniActivity],
    });
  }

  // 9. Quick Quiz
  if (Array.isArray(lesson?.quickQuiz) && lesson.quickQuiz.length > 0) {
    const quizPts = lesson.quickQuiz.map((q: any, i: number) => {
      if (typeof q === 'string') return q;
      const opts = Array.isArray(q.options) && q.options.length > 0 ? ` [${q.options.join(', ')}]` : '';
      const ans = q.correctAnswer ? ` -> ${isAr ? 'الإجابة' : 'Answer'}: ${q.correctAnswer}` : '';
      return `${i + 1}. ${q.question}${opts}${ans}`;
    });
    slides.push({
      title: isAr ? 'اختبار سريع' : 'Quick Checkpoint Quiz',
      bodyPoints: quizPts,
    });
  }

  // 10. Homework
  if (Array.isArray(lesson?.homework) && lesson.homework.length > 0) {
    slides.push({
      title: isAr ? 'الواجب المنزلي' : 'Homework & Practice Assignment',
      bodyPoints: lesson.homework,
    });
  }

  // 11. Teaching Tips
  if (lesson?.teachingTips) {
    const tipPts: string[] = [];
    if (typeof lesson.teachingTips === 'string') {
      tipPts.push(lesson.teachingTips);
    } else {
      if (lesson.teachingTips.whatToEmphasize) {
        tipPts.push(`${isAr ? 'التركيز على' : 'Emphasize'}: ${lesson.teachingTips.whatToEmphasize}`);
      }
      if (lesson.teachingTips.commonConfusion) {
        tipPts.push(`${isAr ? 'الأخطاء الشائعة' : 'Common Confusion'}: ${lesson.teachingTips.commonConfusion}`);
      }
      if (lesson.teachingTips.howToSimplify) {
        tipPts.push(`${isAr ? 'كيفية التبسيط' : 'How to Simplify'}: ${lesson.teachingTips.howToSimplify}`);
      }
    }
    if (tipPts.length > 0) {
      slides.push({
        title: isAr ? 'توجيهات للمعلم' : 'Teacher Guidance & Recitation Tips',
        bodyPoints: tipPts,
      });
    }
  }

  // Fallback if slides array is empty or only title slide
  if (slides.length <= 1) {
    slides.push({
      title: isAr ? 'تفاصيل الدرس' : 'Lesson Details',
      bodyPoints: [
        `${isAr ? 'الموضوع' : 'Topic'}: ${topic}`,
        `${isAr ? 'المادة' : 'Subject'}: ${subject}`,
        isAr ? 'درس تفاعلي مخصص للمعلم والطالب.' : 'Custom interactive lesson created for teacher and student.',
      ],
    });
  }

  return slides;
}

/**
 * Creates a new Google Slides presentation with structured slides.
 */
export async function createGoogleSlidesPresentation(
  accessToken: string,
  title: string,
  rawSlides: SlideContent[],
  options?: {
    onProgress?: (status: string) => void;
  }
): Promise<{ presentationId: string; title: string; webViewLink: string }> {
  console.log('[SLIDES_EXPORT_STARTED] Initiating Google Slides export process');
  options?.onProgress?.('Creating presentation shell...');

  try {
    // 1. Create a blank presentation shell
    const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      await throwForGoogleResponse(createRes, "Google Slides presentation creation");
    }

    const presData = await createRes.json() as { presentationId?: string; title?: string; slides?: Array<{ objectId?: string }> };
    const presentationId = presData.presentationId;
    if (!presentationId) {
      throw new GoogleWorkspaceError("Google Slides returned no presentation ID.", "API_ERROR");
    }
    const defaultSlideId = presData.slides?.[0]?.objectId;

    console.log('[SLIDES_PRESENTATION_CREATED] Created presentation shell with ID:', presentationId);
    options?.onProgress?.('Building slides & lesson content...');

    // 2. Validate and normalize slides
    const slides = Array.isArray(rawSlides) && rawSlides.length > 0
      ? rawSlides
      : [{ title, subtitle: 'IslamRoots Educator Deck' }];

    // 3. Construct atomic batchUpdate requests
    const requests: any[] = [];

    slides.forEach((slide, index) => {
      // Unique object IDs per element using random string suffix to prevent collisions
      const randSuffix = Math.random().toString(36).substring(2, 8);
      const slideId = `slide_${index}_${randSuffix}`;
      const titleShapeId = `title_${index}_${randSuffix}`;
      const bodyShapeId = `body_${index}_${randSuffix}`;

      const isTitleSlide = index === 0;
      const slideTitleText = slide.title || title;
      const isArabicTitle = containsArabic(slideTitleText);

      // A) Create a blank slide layout
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: index,
            slideLayoutReference: {
              predefinedLayout: 'BLANK',
            },
        },
      });

      if (isTitleSlide) {
        // --- TITLE SLIDE DECK COVER ---
        // Title Box
        requests.push({
          createShape: {
            objectId: titleShapeId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 640, unit: 'PT' },
                height: { magnitude: 110, unit: 'PT' },
              },
              transform: {
                scaleX: 1, scaleY: 1,
                translateX: 40, translateY: 90,
                unit: 'PT',
              },
            },
          },
        });

        requests.push({
          insertText: {
            objectId: titleShapeId,
            text: slideTitleText,
          },
        });

        requests.push({
          updateTextStyle: {
            objectId: titleShapeId,
            style: {
              fontSize: { magnitude: 26, unit: 'PT' },
              bold: true,
              foregroundColor: {
                opaqueColor: { rgbColor: { red: 0.18, green: 0.22, blue: 0.18 } },
              },
              fontFamily: isArabicTitle ? 'Arial' : 'Plus Jakarta Sans',
            },
            fields: 'fontSize,bold,foregroundColor,fontFamily',
          },
        });

        requests.push({
          updateParagraphStyle: {
            objectId: titleShapeId,
            style: {
              alignment: isArabicTitle ? 'RIGHT' : 'LEFT',
              direction: isArabicTitle ? 'RIGHT_TO_LEFT' : 'LEFT_TO_RIGHT',
            },
            fields: 'alignment,direction',
          },
        });

        // Subtitle Box
        const subtitleText = slide.subtitle || 'IslamRoots Interactive Deck';
        const isArabicSubtitle = containsArabic(subtitleText);

        requests.push({
          createShape: {
            objectId: bodyShapeId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 640, unit: 'PT' },
                height: { magnitude: 120, unit: 'PT' },
              },
              transform: {
                scaleX: 1, scaleY: 1,
                translateX: 40, translateY: 210,
                unit: 'PT',
              },
            },
          },
        });

        requests.push({
          insertText: {
            objectId: bodyShapeId,
            text: subtitleText,
          },
        });

        requests.push({
          updateTextStyle: {
            objectId: bodyShapeId,
            style: {
              fontSize: { magnitude: 15, unit: 'PT' },
              foregroundColor: {
                opaqueColor: { rgbColor: { red: 0.35, green: 0.42, blue: 0.35 } },
              },
              fontFamily: isArabicSubtitle ? 'Arial' : 'Plus Jakarta Sans',
            },
            fields: 'fontSize,foregroundColor,fontFamily',
          },
        });

        requests.push({
          updateParagraphStyle: {
            objectId: bodyShapeId,
            style: {
              alignment: isArabicSubtitle ? 'RIGHT' : 'LEFT',
              direction: isArabicSubtitle ? 'RIGHT_TO_LEFT' : 'LEFT_TO_RIGHT',
            },
            fields: 'alignment,direction',
          },
        });

      } else {
        // --- CONTENT SLIDE DECK ---
        // Header Banner Rectangle
        const headerShapeId = `header_${index}_${randSuffix}`;

        requests.push({
          createShape: {
            objectId: headerShapeId,
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 720, unit: 'PT' },
                height: { magnitude: 60, unit: 'PT' },
              },
              transform: {
                scaleX: 1, scaleY: 1,
                translateX: 0, translateY: 0,
                unit: 'PT',
              },
            },
          },
        });

        requests.push({
          updateShapeProperties: {
            objectId: headerShapeId,
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: {
                  color: { rgbColor: { red: 0.18, green: 0.22, blue: 0.18 } },
                },
              },
              outline: {
                propertyState: 'NOT_VISIBLE',
              },
            },
            fields: 'shapeBackgroundFill,outline',
          },
        });

        requests.push({
          insertText: {
            objectId: headerShapeId,
            text: slideTitleText,
          },
        });

        requests.push({
          updateTextStyle: {
            objectId: headerShapeId,
            style: {
              fontSize: { magnitude: 18, unit: 'PT' },
              bold: true,
              foregroundColor: {
                opaqueColor: { rgbColor: { red: 0.95, green: 0.95, blue: 0.92 } },
              },
              fontFamily: isArabicTitle ? 'Arial' : 'Plus Jakarta Sans',
            },
            fields: 'fontSize,bold,foregroundColor,fontFamily',
          },
        });

        requests.push({
          updateParagraphStyle: {
            objectId: headerShapeId,
            style: {
              alignment: isArabicTitle ? 'RIGHT' : 'LEFT',
              direction: isArabicTitle ? 'RIGHT_TO_LEFT' : 'LEFT_TO_RIGHT',
            },
            fields: 'alignment,direction',
          },
        });

        // Body Content Box
        const pointsFiltered = (slide.bodyPoints || []).filter(
          (pt) => typeof pt === 'string' && pt.trim().length > 0
        );

        const rawBodyText = pointsFiltered
          .map((pt) => pt.startsWith('•') || /^\d+\./.test(pt) ? pt : `• ${pt}`)
          .join('\n\n') || slide.notes || '';

        if (rawBodyText) {
          const isArabicBody = containsArabic(rawBodyText);
          const fontSizeMag = rawBodyText.length > 400 ? 11 : (rawBodyText.length > 250 ? 12 : 14);

          requests.push({
            createShape: {
              objectId: bodyShapeId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: 640, unit: 'PT' },
                  height: { magnitude: 300, unit: 'PT' },
                },
                transform: {
                  scaleX: 1, scaleY: 1,
                  translateX: 40, translateY: 80,
                  unit: 'PT',
                },
              },
            },
          });

          requests.push({
            insertText: {
              objectId: bodyShapeId,
              text: rawBodyText,
            },
          });

          requests.push({
            updateTextStyle: {
              objectId: bodyShapeId,
              style: {
                fontSize: { magnitude: fontSizeMag, unit: 'PT' },
                foregroundColor: {
                  opaqueColor: { rgbColor: { red: 0.18, green: 0.20, blue: 0.18 } },
                },
                fontFamily: isArabicBody ? 'Arial' : 'Plus Jakarta Sans',
              },
              fields: 'fontSize,foregroundColor,fontFamily',
            },
          });

          requests.push({
            updateParagraphStyle: {
              objectId: bodyShapeId,
              style: {
                alignment: isArabicBody ? 'RIGHT' : 'LEFT',
                direction: isArabicBody ? 'RIGHT_TO_LEFT' : 'LEFT_TO_RIGHT',
                lineSpacing: 115,
              },
              fields: 'alignment,direction,lineSpacing',
            },
          });
        }
      }
    });

    // 4. Delete initial default blank slide created by Google
    if (defaultSlideId) {
      requests.push({
        deleteObject: {
          objectId: defaultSlideId,
        },
      });
    }

    // 5. Send atomic batchUpdate
    console.log('[SLIDES_BATCH_UPDATE_STARTED] Executing batchUpdate request. Total requests:', requests.length);

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
      await throwForGoogleResponse(batchResponse, "Google Slides content export");
    }

    console.log('[SLIDES_BATCH_UPDATE_SUCCESS] Google Slides batchUpdate completed successfully.');
    options?.onProgress?.('Verifying presentation structure...');

    // 6. Export Verification Step
    console.log('[SLIDES_EXPORT_VERIFICATION_STARTED] Fetching presentation details to verify slide content.');

    const verifyRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!verifyRes.ok) {
      await throwForGoogleResponse(verifyRes, "Google Slides export verification");
    }

    const verifyData = await verifyRes.json();

    if (!verifyData.slides || verifyData.slides.length === 0) {
      console.error('[SLIDES_EXPORT_ERROR] Verification failed: Presentation contains zero slides.');
      throw new Error('Verification failed: Exported Google Slides presentation is empty.');
    }

    const hasVisibleContent = (element: any): boolean => {
      const textElements = element?.shape?.text?.textElements || [];
      if (textElements.some((textElement: any) => Boolean(textElement?.textRun?.content?.trim()))) return true;
      if (element?.image || element?.video || element?.table || element?.sheetsChart) return true;
      return Boolean(element?.group?.children?.some((child: any) => hasVisibleContent(child)));
    };

    const blankSlideNumbers = verifyData.slides
      .map((slide: any, index: number) => ({ slide, index }))
      .filter(({ slide }: { slide: any }) => !slide?.pageElements?.some((element: any) => hasVisibleContent(element)))
      .map(({ index }: { index: number }) => index + 1);

    if (blankSlideNumbers.length > 0) {
      console.error('[SLIDES_EXPORT_ERROR] Verification failed: blank slides detected:', blankSlideNumbers);
      throw new Error(`Verification failed: Slides ${blankSlideNumbers.join(", ")} contain no rendered content.`);
    }

    console.log('[SLIDES_EXPORT_VERIFICATION_SUCCESS] Verification successful! Total verified slides count:', verifyData.slides.length);
    options?.onProgress?.('Export complete!');

    const webViewLink = `https://docs.google.com/presentation/d/${presentationId}/edit`;

    return {
      presentationId,
      title: verifyData.title || title,
      webViewLink,
    };
  } catch (err) {
    throw toGoogleWorkspaceError(err, "Google Slides export");
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
    lessonGoal?: string;
    description?: string;
    warmup?: any;
    keyPoints?: string[];
    vocabulary?: any[];
    questionsToAsk?: any;
    examples?: string[];
    miniActivity?: string;
    quickQuiz?: any[];
    homework?: string[];
    teachingTips?: any;
  },
  options?: {
    onProgress?: (status: string) => void;
  }
): Promise<{ presentationId: string; webViewLink: string }> {
  const presTitle = `[IslamRoots Deck] ${lesson.subject} - ${lesson.title}`;

  const slides = normalizeLessonPlanToSlides(
    lesson,
    lesson.subject,
    lesson.title,
    lesson.level
  );

  const result = await createGoogleSlidesPresentation(
    accessToken,
    presTitle,
    slides,
    options
  );

  return {
    presentationId: result.presentationId,
    webViewLink: result.webViewLink,
  };
}

