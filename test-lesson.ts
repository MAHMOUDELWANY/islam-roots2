import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are a world-class Islamic & Arabic educator designing a lesson plan for an international student.
Generate a structured, practical, teacher-friendly lesson plan in English.
Subject: Quran
Topic: Surah Al-Fatiha
Student: Test (Age: 10, Level: Beginner)
Duration: 30 minutes
Teaching Style: Standard
Learning Goal: General mastery and understanding
Important Rules:
1. Ensure explanations are tailored to age 10 (Beginner level).
2. For Quranic or Tajweed topics, ensure 100% accurate Arabic text and accurate explanations.
3. Provide key terms with clear explanations for foreign/international students.
4. Structure the response in JSON matching the exact schema.`;
  console.log("Sending...");
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lessonGoal: { type: Type.STRING },
          warmup: { type: Type.OBJECT, properties: { durationMinutes: { type: Type.NUMBER }, instructions: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.STRING } } } },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { arabic: { type: Type.STRING }, english: { type: Type.STRING }, explanation: { type: Type.STRING }, pronunciation: { type: Type.STRING } } } },
          questionsToAsk: { type: Type.OBJECT, properties: { easy: { type: Type.ARRAY, items: { type: Type.STRING } }, medium: { type: Type.ARRAY, items: { type: Type.STRING } }, challenge: { type: Type.ARRAY, items: { type: Type.STRING } } } },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } },
          miniActivity: { type: Type.STRING },
          quickQuiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } } } },
          homework: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  console.log("Response JSON:", response.text);
}
test().catch(console.error);
