import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features will be limited.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateMatchInsight(matchData: any, events: any[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI sports analyst for the Agentic Premier League. 
      Analyze this match state: ${JSON.stringify(matchData)} and these recent events: ${JSON.stringify(events)}.
      Provide a concise, tactical insight or prediction in one or two sentences.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating insight:", error);
    return "Analyzing match flow...";
  }
}
