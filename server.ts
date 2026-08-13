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
import dotenv from "dotenv";

dotenv.config();

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 8_500);
const PRIMARY_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function generateWithTimeout(ai: GoogleGenAI, options: GenerateContentParameters) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("VERCEL_TIMEOUT")), AI_TIMEOUT_MS);
  });

  try {
    return await Promise.race([ai.models.generateContent(options), timeoutPromise]);
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
      const { subject, topic, studentName, studentAge, studentLevel, duration, teachingStyle, language, learningGoal, customInstructions, studentProfile, learningHistory } = validation.value;
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `You are the senior pedagogical planner for the ISLAM ROOTS teacher workspace. Generate a complete, structured lesson plan in ${isArabic ? "Modern Standard Arabic" : "English"}.

TRUSTED LESSON CONTEXT
Subject: ${subject}
Topic: ${topic}
Student: ${studentName} (Age: ${studentAge}, Requested level: ${studentLevel})
Duration: ${duration} minutes
Teaching style: ${teachingStyle}
Learning goal: ${learningGoal || "General mastery and understanding"}
Student profile (identity/context only): ${JSON.stringify(studentProfile)}
Recorded learning history (evidence only; may be empty): ${JSON.stringify(learningHistory)}
Teacher focus (highest-priority constraint): ${customInstructions || "No additional focus provided."}

PEDAGOGICAL RULES
1. Make Beginner, Intermediate, and Advanced visibly different: Beginner uses simpler language, modeling, scaffolding, examples, controlled practice, and frequent checks; Intermediate uses moderate scaffolding, broader vocabulary, and meaningful independent application; Advanced uses nuance, error analysis, authentic application, higher-order tasks, and independent production.
2. Treat the teacher focus as a hard priority. Allocate the majority of examples, guided practice, questions, assessment, and homework to that focus. Do not drift into unrelated topics.
3. Use recorded learning history only when present. Never infer strengths, weaknesses, accuracy, mastery, attendance, or improvement from profile fields. If history is empty, internally state: No prior learning history available.
4. Scale depth to the requested duration: 30 minutes is compact, 60 minutes is substantially developed, and 90 minutes is an extended session with realistic time allocation.
5. Include learning objectives, retrieval/warm-up, teaching/presentation, examples, guided practice, a checkpoint, controlled practice, applied or communicative practice, error correction, independent work, assessment, homework, and teacher notes as appropriate to the subject and duration.
6. For Quranic or Tajweed topics, provide careful explanations and do not fabricate citations or student performance.
7. Return only the requested JSON structure.`;

      console.log("[JAL_GENERATION_AI_REQUEST] Sending request to AI Provider");
      const response = await generateWithTimeout(ai, {
        model: PRIMARY_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lessonGoal: { type: Type.STRING },
              warmup: {
                type: Type.OBJECT,
                properties: {
                  durationMinutes: { type: Type.NUMBER },
                  instructions: { type: Type.STRING },
                  questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["durationMinutes", "instructions", "questions"],
              },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    arabic: { type: Type.STRING },
                    english: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    pronunciation: { type: Type.STRING },
                  },
                  required: ["arabic", "english", "explanation"],
                },
              },
              questionsToAsk: {
                type: Type.OBJECT,
                properties: {
                  easy: { type: Type.ARRAY, items: { type: Type.STRING } },
                  medium: { type: Type.ARRAY, items: { type: Type.STRING } },
                  challenge: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["easy", "medium", "challenge"],
              },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
              miniActivity: { type: Type.STRING },
              quickQuiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                  },
                  required: ["question", "options", "correctAnswer"],
                },
              },
              homework: { type: Type.ARRAY, items: { type: Type.STRING } },
              teachingTips: {
                type: Type.OBJECT,
                properties: {
                  whatToEmphasize: { type: Type.STRING },
                  commonConfusion: { type: Type.STRING },
                  howToSimplify: { type: Type.STRING },
                },
                required: ["whatToEmphasize", "commonConfusion", "howToSimplify"],
              },
            },
            required: [
              "lessonGoal",
              "warmup",
              "keyPoints",
              "vocabulary",
              "questionsToAsk",
              "examples",
              "miniActivity",
              "quickQuiz",
              "homework",
              "teachingTips",
            ],
          },
        },
      });

      const result = parseModelResponse(response, [
        "lessonGoal", "warmup", "keyPoints", "vocabulary", "questionsToAsk", "examples", "miniActivity", "quickQuiz", "homework", "teachingTips",
      ]);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("[Gemini] Lesson-plan generation failed.", err?.message || "unknown");
      return sendServerError(res);
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
