import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, type GenerateContentParameters } from "@google/genai";
import { requireAuth } from "./src/middleware/auth";
import {
  aiRateLimiter,
  hasRequiredModelFields,
  sendInvalidRequest,
  sendServerError,
  validateHomeworkInput,
  validateLessonPlanInput,
  validateQuizInput,
  validateSlidesPlanInput,
  validateStudentInsightsInput,
} from "./src/server/aiSecurity";
import { supabaseAdmin } from "./src/lib/supabase-admin";
import dotenv from "dotenv";

dotenv.config();

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 8_500);
const SUPPORTED_GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"] as const;
const configuredGeminiModel = process.env.GEMINI_MODEL?.trim();
const PRIMARY_GEMINI_MODEL = configuredGeminiModel && SUPPORTED_GEMINI_MODELS.includes(configuredGeminiModel as (typeof SUPPORTED_GEMINI_MODELS)[number])
  ? configuredGeminiModel
  : "gemini-3.5-flash";

console.info("[AI_CONFIG] Gemini lesson model selected.", {
  model: PRIMARY_GEMINI_MODEL,
  explicitlyConfigured: Boolean(configuredGeminiModel),
  apiKeyPresent: Boolean(process.env.GEMINI_API_KEY?.trim()),
});

async function generateWithTimeout(ai: GoogleGenAI, options: GenerateContentParameters) {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("VERCEL_TIMEOUT"));
    }, AI_TIMEOUT_MS);
  });
  const request = ai.models.generateContent({
    ...options,
    config: {
      ...(options.config || {}),
      abortSignal: controller.signal,
    },
  });
  try {
    return await Promise.race([request, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "islam-roots-server",
      },
    },
  });
}

function parseModelResponse(response: { text?: string }, requiredFields: string[]) {
  const text = response.text || "{}";
  const parsed = JSON.parse(text) as unknown;
  if (!hasRequiredModelFields(parsed, requiredFields)) {
    throw new Error("INVALID_MODEL_RESPONSE");
  }
  return parsed;
}

const LESSON_PLAN_FIELDS = [
  "lessonGoal", "learningObjectives", "teacherExplanation", "guidedPractice", "studentPractice", "checkpointQuestions",
  "differentiatedActivities", "assessment", "estimatedTiming", "warmup", "keyPoints", "vocabulary", "questionsToAsk",
  "examples", "miniActivity", "quickQuiz", "homework", "teachingTips",
];

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown, minLength = 1): value is string[] {
  return Array.isArray(value) && value.length >= minLength && value.every(isNonEmptyString);
}

function isLessonPlanOutput(value: unknown): boolean {
  if (!hasRequiredModelFields(value, LESSON_PLAN_FIELDS) || !isRecord(value)) return false;
  const warmup = value.warmup;
  const differentiated = value.differentiatedActivities;
  const timing = value.estimatedTiming;
  const questions = value.questionsToAsk;
  const teachingTips = value.teachingTips;
  if (!isNonEmptyString(value.lessonGoal) || !isStringArray(value.learningObjectives) || !isNonEmptyString(value.teacherExplanation)) return false;
  if (!isStringArray(value.guidedPractice) || !isStringArray(value.studentPractice) || !isStringArray(value.checkpointQuestions)) return false;
  if (!isRecord(differentiated) || !isNonEmptyString(differentiated.beginner) || !isNonEmptyString(differentiated.intermediate) || !isNonEmptyString(differentiated.advanced)) return false;
  if (!isStringArray(value.assessment) || !isRecord(timing)) return false;
  const timingKeys = ["warmupMinutes", "explanationMinutes", "guidedPracticeMinutes", "studentPracticeMinutes", "assessmentMinutes", "totalMinutes"];
  if (!timingKeys.every((key) => typeof timing[key] === "number" && Number.isFinite(timing[key]) && timing[key] >= 0)) return false;
  if (!isRecord(warmup) || typeof warmup.durationMinutes !== "number" || !isNonEmptyString(warmup.instructions) || !isStringArray(warmup.questions)) return false;
  if (!isStringArray(value.keyPoints) || !isStringArray(value.examples) || !isNonEmptyString(value.miniActivity) || !isStringArray(value.homework)) return false;
  if (!Array.isArray(value.vocabulary) || value.vocabulary.length === 0 || !value.vocabulary.every((item) => isRecord(item) && isNonEmptyString(item.arabic) && isNonEmptyString(item.english) && isNonEmptyString(item.explanation))) return false;
  if (!isRecord(questions) || !isStringArray(questions.easy) || !isStringArray(questions.medium) || !isStringArray(questions.challenge)) return false;
  if (!Array.isArray(value.quickQuiz) || value.quickQuiz.length === 0 || !value.quickQuiz.every((item) => isRecord(item) && isNonEmptyString(item.question) && isStringArray(item.options) && isNonEmptyString(item.correctAnswer))) return false;
  return isRecord(teachingTips) && isNonEmptyString(teachingTips.whatToEmphasize) && isNonEmptyString(teachingTips.commonConfusion) && isNonEmptyString(teachingTips.howToSimplify);
}

async function generateLessonWithRepair(ai: GoogleGenAI, options: GenerateContentParameters) {
  const response = await generateWithTimeout(ai, options);
  try {
    const parsed = parseModelResponse(response, LESSON_PLAN_FIELDS);
    if (!isLessonPlanOutput(parsed)) throw new Error("INVALID_MODEL_RESPONSE");
    return parsed;
  } catch (parseError: any) {
    console.warn("[Lesson] Structured response parse failed; attempting safe repair.", parseError?.message || "unknown");
    const cleaned = (response.text || "").replace(/```json|```/g, "").trim();
    try {
      const repaired = JSON.parse(cleaned);
      if (isLessonPlanOutput(repaired)) return repaired;
    } catch {
      // Continue to the single deterministic retry below.
    }

    console.warn("[Lesson] Safe repair failed; retrying once with deterministic generation.");
    const retryResponse = await generateWithTimeout(ai, {
      ...options,
      config: {
        ...(options.config || {}),
        temperature: 0,
      },
    });
    const retryResult = parseModelResponse(retryResponse, LESSON_PLAN_FIELDS);
    if (!isLessonPlanOutput(retryResult)) throw new Error("INVALID_MODEL_RESPONSE");
    return retryResult;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "100kb" }));


  // API: Grant Super Admin Claim
  app.post("/api/auth/claim-admin", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
      if (!adminEmail) {
        console.error("[Auth] SUPER_ADMIN_EMAIL is not configured.");
        return res.status(503).json({ error: "Administrator provisioning is unavailable." });
      }

      if (user.email?.toLowerCase() !== adminEmail || !user.email_verified) {
        return res.status(403).json({ error: "Forbidden." });
      }

      const { supabaseAdmin } = await import("./src/lib/supabase-admin");
      const { data, error } = await supabaseAdmin
        .from("teachers")
        .update({ is_super_admin: true })
        .eq("id", user.uid)
        .select("id, is_super_admin");

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Teacher profile not found." });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Auth] Failed to provision the configured administrator.", err?.code || err?.message || "unknown");
      return sendServerError(res);
    }
  });

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Islam Roots Server" });
  });

  // API: Quran Foundation / API Proxy
  app.get("/api/quran/surahs", async (_req, res) => {
    try {
      const response = await fetch("https://api.quran.com/api/v4/chapters?language=en");
      if (!response.ok) throw new Error(`Quran API returned ${response.status}`);
      return res.json(await response.json());
    } catch (err: any) {
      console.error("[Quran] Failed to proxy surahs.", err?.message || "unknown");
      return sendServerError(res);
    }
  });

  app.get("/api/quran/verses/:surahId", async (req, res) => {
    const surahId = Number(req.params.surahId);
    const perPage = Number(req.query.perPage ?? 50);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || !Number.isInteger(perPage) || perPage < 1 || perPage > 300) {
      return sendInvalidRequest(res, "surahId must be 1–114 and perPage must be 1–300.");
    }

    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=en&words=false&translations=131&fields=text_uthmani&per_page=${perPage}`,
      );
      if (!response.ok) throw new Error(`Quran API returned ${response.status}`);
      return res.json(await response.json());
    } catch (err: any) {
      console.error("[Quran] Failed to proxy verses.", err?.message || "unknown");
      return sendServerError(res);
    }
  });

  // API: AI Lesson Generator
  app.post("/api/gemini/lesson-plan", requireAuth, aiRateLimiter, async (req, res) => {
    const validation = validateLessonPlanInput(req.body);
    if ("error" in validation) return sendInvalidRequest(res, validation.error);

    try {
      const { subject, topic, duration, teachingStyle, language, learningGoal, learningGoals, customInstructions, curriculumId } = validation.value;
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized.", category: "AUTH_ERROR" });

      const { data: trustedStudent, error: studentError } = await supabaseAdmin
        .from("students")
        .select("id, name, age, level, subjects, native_language, learning_language, notes")
        .eq("id", validation.value.studentId)
        .eq("teacher_id", userId)
        .maybeSingle();
      if (studentError) {
        console.error("[Lesson] Student lookup failed.", studentError.code || "unknown");
        return res.status(503).json({ error: "Student data could not be verified.", category: "DATABASE_ERROR" });
      }
      if (!trustedStudent || typeof trustedStudent.name !== "string" || !trustedStudent.name.trim() || typeof trustedStudent.age !== "number") {
        return res.status(400).json({ error: "Selected student data is incomplete.", category: "VALIDATION_ERROR" });
      }
      const trustedSubjects = Array.isArray(trustedStudent.subjects) ? trustedStudent.subjects : [];
      if (!trustedSubjects.includes(subject)) {
        return res.status(400).json({ error: "Selected subject is not assigned to this student.", category: "VALIDATION_ERROR" });
      }
      if (typeof trustedStudent.level !== "string" || !["Beginner", "Intermediate", "Advanced"].includes(trustedStudent.level)) {
        return res.status(400).json({ error: "Selected student level is incomplete.", category: "VALIDATION_ERROR" });
      }

      let trustedCurriculumContext: Record<string, unknown> | null = null;
      if (curriculumId) {
        const { data: assignment, error: assignmentError } = await supabaseAdmin
          .from("student_curriculums")
          .select("curriculum_id, progress_percentage, current_lesson_id")
          .eq("teacher_id", userId)
          .eq("student_id", trustedStudent.id)
          .eq("curriculum_id", curriculumId)
          .maybeSingle();
        if (assignmentError) {
          console.error("[Lesson] Curriculum assignment lookup failed.", assignmentError.code || "unknown");
          return res.status(503).json({ error: "Curriculum data could not be verified.", category: "DATABASE_ERROR" });
        }
        if (!assignment) {
          return res.status(400).json({ error: "The selected curriculum is not assigned to this student.", category: "VALIDATION_ERROR" });
        }

        const { data: curriculum, error: curriculumError } = await supabaseAdmin
          .from("curriculums")
          .select("name, subject, level")
          .eq("teacher_id", userId)
          .eq("id", curriculumId)
          .maybeSingle();
        if (curriculumError) {
          console.error("[Lesson] Curriculum lookup failed.", curriculumError.code || "unknown");
          return res.status(503).json({ error: "Curriculum data could not be verified.", category: "DATABASE_ERROR" });
        }
        if (!curriculum || curriculum.subject !== subject || !["Beginner", "Intermediate", "Advanced"].includes(curriculum.level)) {
          return res.status(400).json({ error: "The selected curriculum does not match the lesson subject or level.", category: "VALIDATION_ERROR" });
        }
        trustedCurriculumContext = {
          name: curriculum.name,
          subject: curriculum.subject,
          level: curriculum.level,
          progressPercentage: assignment.progress_percentage || 0,
          currentLessonId: assignment.current_lesson_id || null,
        };
      }

      const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from("lesson_sessions")
        .select("lesson_title, date, attendance_status, teacher_notes, quiz_score, completed_items")
        .eq("teacher_id", userId)
        .eq("student_id", trustedStudent.id)
        .order("date", { ascending: false })
        .limit(8);
      if (sessionsError) {
        console.error("[Lesson] Student history lookup failed.", sessionsError.code || "unknown");
        return res.status(503).json({ error: "Student history could not be verified.", category: "DATABASE_ERROR" });
      }

      const trustedStudentProfile = {
        id: trustedStudent.id,
        name: trustedStudent.name,
        age: trustedStudent.age,
        nativeLanguage: trustedStudent.native_language,
        learningLanguage: trustedStudent.learning_language,
        level: trustedStudent.level,
        subjects: trustedSubjects,
        teacherNotes: trustedStudent.notes || "",
      };
      const trustedLearningHistory = {
        curriculum: trustedCurriculumContext,
        sessions: (sessions || []).map((session) => ({
          lessonTitle: session.lesson_title,
          date: session.date,
          attendanceStatus: session.attendance_status,
          teacherNotes: session.teacher_notes || "",
          quizScore: session.quiz_score ?? null,
          completedItems: session.completed_items,
        })),
      };
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `You are the senior pedagogical planner for the ISLAM ROOTS teacher workspace. Generate a complete, structured lesson plan in ${isArabic ? "Modern Standard Arabic" : "English"}.

TRUSTED LESSON CONTEXT
Subject: ${subject}
Topic: ${topic}
Student: ${trustedStudent.name} (Age: ${trustedStudent.age}, Level: ${trustedStudent.level})
Duration: ${duration} minutes
Teaching style: ${teachingStyle}
Selected learning goals (high-priority teaching targets): ${learningGoals.join("; ")}
Learning goal summary: ${learningGoal || learningGoals.join("; ")}
Student profile (identity/context only): ${JSON.stringify(trustedStudentProfile)}
Recorded learning history (evidence only; may be empty): ${JSON.stringify(trustedLearningHistory)}
Curriculum context (if assigned): ${trustedCurriculumContext ? JSON.stringify(trustedCurriculumContext) : "No specific curriculum assigned."}
Teacher focus (highest-priority constraint): ${customInstructions || "No additional focus provided."}

PEDAGOGICAL RULES
1. Follow this priority order: student level first, selected learning goals second, teacher focus third, subject fourth, topic fifth, real history/progress sixth, and general pedagogy last.
2. Make Beginner, Intermediate, and Advanced substantively different: Beginner uses modeling, smaller chunks, simpler explanations, more scaffolding, and more guided practice; Intermediate uses less scaffolding, deeper application, and more independent practice; Advanced uses analysis, nuanced application, error diagnosis, challenging tasks, and independent performance.
3. Treat the selected learning goals as hard requirements. Every major section, example, guided exercise, targeted practice task, and assessment must serve those goals. Do not generate a generic subject lesson.
4. Treat the teacher focus as a hard priority after the selected goals. Allocate the majority of examples, guided practice, questions, assessment, and homework to that focus. Do not drift into unrelated topics.
5. Use recorded learning history only when present. Never infer strengths, weaknesses, accuracy, mastery, attendance, or improvement from profile fields. If history is empty, internally state: No prior learning history available.
6. Scale depth to the requested duration: 30 minutes is compact, 60 minutes is substantially developed, and 90 minutes is an extended session with realistic time allocation.
7. Include learning objectives, retrieval/warm-up, teaching/presentation, examples, guided practice, a checkpoint, controlled practice, applied or communicative practice, error correction, independent work, assessment, homework, and teacher notes as appropriate to the subject and duration.
8. For Quranic or Tajweed topics, provide careful explanations and do not fabricate citations or student performance.
9. Return only the requested JSON structure.`;

      console.log("[JAL_GENERATION_AI_REQUEST] Sending request to AI Provider", { model: PRIMARY_GEMINI_MODEL });
      const result = await generateLessonWithRepair(ai, {
        model: PRIMARY_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lessonGoal: { type: Type.STRING },
              learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              teacherExplanation: { type: Type.STRING },
              guidedPractice: { type: Type.ARRAY, items: { type: Type.STRING } },
              studentPractice: { type: Type.ARRAY, items: { type: Type.STRING } },
              checkpointQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              differentiatedActivities: { type: Type.OBJECT, properties: { beginner: { type: Type.STRING }, intermediate: { type: Type.STRING }, advanced: { type: Type.STRING } }, required: ["beginner", "intermediate", "advanced"] },
              assessment: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedTiming: { type: Type.OBJECT, properties: { warmupMinutes: { type: Type.NUMBER }, explanationMinutes: { type: Type.NUMBER }, guidedPracticeMinutes: { type: Type.NUMBER }, studentPracticeMinutes: { type: Type.NUMBER }, assessmentMinutes: { type: Type.NUMBER }, totalMinutes: { type: Type.NUMBER } }, required: ["warmupMinutes", "explanationMinutes", "guidedPracticeMinutes", "studentPracticeMinutes", "assessmentMinutes", "totalMinutes"] },
              warmup: { type: Type.OBJECT, properties: { durationMinutes: { type: Type.NUMBER }, instructions: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["durationMinutes", "instructions", "questions"] },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { arabic: { type: Type.STRING }, english: { type: Type.STRING }, explanation: { type: Type.STRING }, pronunciation: { type: Type.STRING } }, required: ["arabic", "english", "explanation"] } },
              questionsToAsk: { type: Type.OBJECT, properties: { easy: { type: Type.ARRAY, items: { type: Type.STRING } }, medium: { type: Type.ARRAY, items: { type: Type.STRING } }, challenge: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["easy", "medium", "challenge"] },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
              miniActivity: { type: Type.STRING },
              quickQuiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } }, required: ["question", "options", "correctAnswer"] } },
              homework: { type: Type.ARRAY, items: { type: Type.STRING } },
              teachingTips: { type: Type.OBJECT, properties: { whatToEmphasize: { type: Type.STRING }, commonConfusion: { type: Type.STRING }, howToSimplify: { type: Type.STRING } }, required: ["whatToEmphasize", "commonConfusion", "howToSimplify"] },
            },
            required: LESSON_PLAN_FIELDS,
          },
        },
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[Gemini] Lesson-plan generation failed.", err?.message || "unknown");
      if (err.message === "VERCEL_TIMEOUT") {
        return res.status(504).json({ error: "The AI request timed out.", category: "TIMEOUT_ERROR" });
      }
      if (err.message === "AI_PROVIDER_NOT_CONFIGURED") {
        return res.status(503).json({ error: "AI service is not configured.", category: "CONFIG_ERROR" });
      }
      if (err.status === 404 || err.message?.includes("not found") || err.message?.includes("no longer available")) {
        return res.status(502).json({ error: "The configured AI model is unavailable.", category: "MODEL_ERROR" });
      }
      return res.status(502).json({ error: "The AI provider could not complete the lesson request.", category: "PROVIDER_ERROR" });
    }
  });

  // API: AI Slides Generator
  app.post("/api/gemini/slides-plan", requireAuth, aiRateLimiter, async (req, res) => {
    const validation = validateSlidesPlanInput(req.body);
    if ("error" in validation) return sendInvalidRequest(res, validation.error);

    try {
      const { subject, topic, studentName, studentAge, studentLevel, duration, teachingStyle, language, learningGoal, customInstructions, lessonPlan } = validation.value;
      const ai = getAi();
      const isArabic = language === "ar";
      const prompt = `You are a world-class Islamic & Arabic educator designing a Google Slides presentation structure for a lesson.\n
Generate a structured, practical slide deck in ${isArabic ? "Arabic" : "English"} based on this lesson plan:\n${JSON.stringify(lessonPlan)}\n\n
Context: Subject: ${subject}, Topic: ${topic}, Student: ${studentName} (Age: ${studentAge}, Level: ${studentLevel}), Duration: ${duration} minutes, Style: ${teachingStyle || "Standard"}, Goal: ${learningGoal || "General"}, Notes: ${customInstructions || "None"}.\n
The number of slides should be appropriate for a ${duration} minute lesson.\n
Provide the title, bullet points, and speaker notes for each slide.`;
      const response = await generateWithTimeout(ai, {
        model: PRIMARY_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    bodyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    notes: { type: Type.STRING },
                  },
                  required: ["title", "bodyPoints", "notes"],
                },
              },
            },
            required: ["title", "slides"],
          },
        },
      });
      const result = parseModelResponse(response, ["title", "slides"]);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[Gemini] Slides-plan generation failed.", err?.message || "unknown");
      return sendServerError(res);
    }
  });

  // API: AI Quiz Generator
  app.post("/api/gemini/quiz", requireAuth, aiRateLimiter, async (req, res) => {
    const validation = validateQuizInput(req.body);
    if ("error" in validation) return sendInvalidRequest(res, validation.error);

    try {
      const { subject, topic, level, count, difficulty, language } = validation.value;
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `Generate a ${count}-question quiz in ${isArabic ? "Arabic" : "English"} for an international student.
Subject: ${subject}
Topic: ${topic}
Level: ${level}
Difficulty: ${difficulty}

Include a mix of multiple choice, true/false, and short answer questions.
Provide the question, list of options (if applicable), correct answer, and a short explanation.`;

      const response = await generateWithTimeout(ai, {
        model: PRIMARY_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, description: "multiple_choice, true_false, or short_answer" },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["type", "question", "correctAnswer", "explanation"],
                },
              },
            },
            required: ["title", "questions"],
          },
        },
      });

      const result = parseModelResponse(response, ["title", "questions"]);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[Gemini] Quiz generation failed.", err?.message || "unknown");
      return sendServerError(res);
    }
  });

  // API: AI Homework Generator
  app.post("/api/gemini/homework", requireAuth, aiRateLimiter, async (req, res) => {
    const validation = validateHomeworkInput(req.body);
    if ("error" in validation) return sendInvalidRequest(res, validation.error);

    try {
      const { subject, topic, level, age, language } = validation.value;
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `Create an engaging, age-appropriate homework assignment for a student studying ${subject}.
Topic: ${topic}
Student Age: ${age}
Level: ${level}
Language: ${isArabic ? "Arabic" : "English"}

Keep it practical, encouraging, and clear.`;

      const response = await generateWithTimeout(ai, {
        model: PRIMARY_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskNumber: { type: Type.NUMBER },
                    instruction: { type: Type.STRING },
                    detail: { type: Type.STRING },
                  },
                  required: ["taskNumber", "instruction"],
                },
              },
              teacherNote: { type: Type.STRING },
            },
            required: ["title", "estimatedMinutes", "tasks"],
          },
        },
      });

      const result = parseModelResponse(response, ["title", "estimatedMinutes", "tasks"]);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[Gemini] Homework generation failed.", err?.message || "unknown");
      return sendServerError(res);
    }
  });

  // API: AI Student Insights Generator
  app.post("/api/gemini/student-insights", requireAuth, aiRateLimiter, async (req, res) => {
    const validation = validateStudentInsightsInput(req.body);
    if ("error" in validation) return sendInvalidRequest(res, validation.error);

    try {
      const { studentName, subject, level, attendanceRate, recentSessions, quizScores, language } = validation.value;
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `Analyze this student's learning progress and generate 3 concise, helpful AI insights for the teacher.
Student Name: ${studentName}
Subject: ${subject} (${level})
Attendance Rate: ${attendanceRate}%
Recent Activity Summary: ${JSON.stringify(recentSessions || [])}
Quiz Scores: ${JSON.stringify(quizScores || [])}
Language: ${isArabic ? "Arabic" : "English"}

Provide:
1. Overall progress assessment
2. Main strength
3. Key recommendation/action item for next lesson`;

      const response = await generateWithTimeout(ai, {
        model: PRIMARY_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallAssessment: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasToFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionableTip: { type: Type.STRING },
            },
            required: ["overallAssessment", "strengths", "areasToFocus", "actionableTip"],
          },
        },
      });

      const result = parseModelResponse(response, ["overallAssessment", "strengths", "areasToFocus", "actionableTip"]);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[Gemini] Student-insights generation failed.", err?.message || "unknown");
      return sendServerError(res);
    }
  });

  // Vite Middleware for development / Static file serving for production
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (isProduction) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite failed to load in dev mode, serving dist static files if available:", e);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (_req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }
    }
  }

  if (!process.env.IS_VERCEL) { 
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Islam Roots server listening on http://0.0.0.0:${PORT}`);
    });
  }
  return app;
}

export const appPromise = startServer();
