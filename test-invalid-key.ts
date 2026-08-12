import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "invalid-key" });
  try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: "hello",
      });
      console.log("Response:", response.text);
  } catch (e) {
      console.log("Error status:", e.status);
      console.log("Error message:", e.message);
  }
}
test().catch(console.error);
