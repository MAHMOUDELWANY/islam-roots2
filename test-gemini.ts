import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test(modelName) {
  try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Write a small JSON object with a key 'hello' and value 'world'.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { hello: { type: Type.STRING } },
          },
        }
      });
      console.log(`Success with ${modelName}:`, response.text);
  } catch (e) {
      console.log(`Failed with ${modelName}:`, e.message);
  }
}

async function run() {
    await test("gemini-3.5-flash");
}
run();
