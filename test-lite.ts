import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("Sending to gemini-3.5-flash-lite...");
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: "Write a 5-sentence story about a cat.",
  });
  console.log("Took", Date.now() - start, "ms");
  console.log("Response:", response.text);
}
test().catch(console.error);
