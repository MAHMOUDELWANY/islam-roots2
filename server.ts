import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { requireAuth } from "./src/middleware/auth";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini AI Client
  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "placeholder-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };


  // API: Grant Super Admin Claim
  app.post("/api/auth/claim-admin", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const adminEmail = "mhmwdlwany4222@gmail.com";
      if (user.email && user.email.toLowerCase() === adminEmail.toLowerCase() && user.email_verified) {
        const { adminAuth } = await import("./src/lib/firebase-admin");
        await adminAuth.setCustomUserClaims(user.uid, { superAdmin: true });
        return res.json({ success: true, message: "Super admin claim granted" });
      }
      
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    } catch (err: any) {
      console.error("Error setting custom claim:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Islam Roots Server" });
  });

  // API: Quran Foundation / API Proxy
  app.get("/api/quran/surahs", async (req, res) => {
    try {
      const response = await fetch("https://api.quran.com/api/v4/chapters?language=en");
      if (!response.ok) throw new Error("Failed to fetch surahs from Quran API");
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Error proxying surahs:", err);
      res.status(500).json({ error: err.message || "Failed to fetch surahs" });
    }
  });

  app.get("/api/quran/verses/:surahId", async (req, res) => {
    try {
      const { surahId } = req.params;
      const perPage = req.query.perPage || 50;
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=en&words=false&translations=131&fields=text_uthmani&per_page=${perPage}`
      );
      if (!response.ok) throw new Error("Failed to fetch verses from Quran API");
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Error proxying verses:", err);
      res.status(500).json({ error: err.message || "Failed to fetch verses" });
    }
  });

  // API: AI Lesson Generator
  app.post("/api/gemini/lesson-plan", requireAuth, async (req, res) => {
    try {
      const {
        subject,
        topic,
        studentName,
        studentAge,
        studentLevel,
        duration,
        teachingStyle,
        language,
        learningGoal,
        customInstructions,
      } = req.body;

      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `You are a world-class Islamic & Arabic educator designing a lesson plan for an international student.
Generate a structured, practical, teacher-friendly lesson plan in ${isArabic ? "Arabic" : "English"}.

Subject: ${subject}
Topic: ${topic}
Student: ${studentName} (Age: ${studentAge}, Level: ${studentLevel})
Duration: ${duration} minutes
Teaching Style: ${teachingStyle}
Learning Goal: ${learningGoal || "General mastery and understanding"}

Important Rules:
1. Ensure explanations are tailored to age ${studentAge} (${studentLevel} level).
2. For Quranic or Tajweed topics, ensure 100% accurate Arabic text and accurate explanations.
3. Provide key terms with clear explanations for foreign/international students.
${customInstructions ? `4. Custom Instructions: ${customInstructions}` : ""}
4. Structure the response in JSON matching the exact schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("Error generating lesson plan:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate lesson plan" });
    }
  });

  // API: AI Slides Generator
  app.post("/api/gemini/slides-plan", requireAuth, async (req, res) => {
    try {
      const { subject, topic, studentName, studentAge, studentLevel, duration, teachingStyle, language, learningGoal, customInstructions, lessonPlan } = req.body;
      const ai = getAi();
      const isArabic = language === "ar";
      const prompt = `You are a world-class Islamic & Arabic educator designing a Google Slides presentation structure for a lesson.\n
Generate a structured, practical slide deck in ${isArabic ? "Arabic" : "English"} based on this lesson plan:\n${JSON.stringify(lessonPlan)}\n\n
Context: Subject: ${subject}, Topic: ${topic}, Student: ${studentName} (Age: ${studentAge}, Level: ${studentLevel}), Duration: ${duration} minutes.\n
The number of slides should be appropriate for a ${duration} minute lesson.\n
Provide the title, bullet points, and speaker notes for each slide.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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
      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("Error generating slides plan:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate slides plan" });
    }
  });

  // API: AI Quiz Generator
  app.post("/api/gemini/quiz", requireAuth, async (req, res) => {
    try {
      const { subject, topic, level, count, difficulty, language } = req.body;
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `Generate a ${count}-question quiz in ${isArabic ? "Arabic" : "English"} for an international student.
Subject: ${subject}
Topic: ${topic}
Level: ${level}
Difficulty: ${difficulty}

Include a mix of multiple choice, true/false, and short answer questions.
Provide the question, list of options (if applicable), correct answer, and a short explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      const text = response.text || "{}";
      res.json({ success: true, data: JSON.parse(text) });
    } catch (err: any) {
      console.error("Error generating quiz:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate quiz" });
    }
  });

  // API: AI Homework Generator
  app.post("/api/gemini/homework", requireAuth, async (req, res) => {
    try {
      const { subject, topic, level, age, language } = req.body;
      const ai = getAi();
      const isArabic = language === "ar";

      const prompt = `Create an engaging, age-appropriate homework assignment for a student studying ${subject}.
Topic: ${topic}
Student Age: ${age}
Level: ${level}
Language: ${isArabic ? "Arabic" : "English"}

Keep it practical, encouraging, and clear.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      const text = response.text || "{}";
      res.json({ success: true, data: JSON.parse(text) });
    } catch (err: any) {
      console.error("Error generating homework:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate homework" });
    }
  });

  // API: AI Student Insights Generator
  app.post("/api/gemini/student-insights", requireAuth, async (req, res) => {
    try {
      const { studentName, subject, level, attendanceRate, recentSessions, quizScores, language } = req.body;
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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      const text = response.text || "{}";
      res.json({ success: true, data: JSON.parse(text) });
    } catch (err: any) {
      console.error("Error generating student insights:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate student insights" });
    }
  });

  // Vite Middleware for development / Static file serving for production
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (isProduction) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
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
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Islam Roots server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
