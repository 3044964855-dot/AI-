import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedImage, TranscriptItem, Correction, ConversationHints } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateAvatarImage = async (): Promise<GeneratedImage> => {
  if (!API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Reverting to gemini-2.5-flash-image as Imagen might not be enabled.
  const model = 'gemini-2.5-flash-image';
  const prompt = 'Generate an image. A friendly, cute, high-quality cartoon style illustration of Marilyn Monroe. She is facing the camera directly. She is smiling warmly and looks encouraging. She has blonde curly hair, red lipstick, and her iconic white dress. The background is a soft, simple pastel pink gradient. Aspect ratio 1:1. Style: Modern flat vector art mixed with disney style, very clean lines.';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // Explicitly requesting image generation config helps the model understand the task
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Extract image from response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const url = `data:${mimeType};base64,${base64Data}`;
          return { url };
        }
      }
    }
    
    console.warn("Model returned text instead of image:", response.candidates?.[0]?.content?.parts?.[0]?.text);
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Avatar generation failed:", error);
    // Fallback to a placeholder if generation fails, to ensure app usability
    return { url: 'https://picsum.photos/500/500' };
  }
};

export const generateVisualAidImage = async (prompt: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing");
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-2.5-flash-image';
  
  const fullPrompt = `Generate an image. Create a simple, fun, cartoon-style illustration or meme explaining this concept: "${prompt}". Style: Minimalist, clear, friendly, similar to the main avatar style but focused on the object/scene.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return '';
  } catch (error) {
    console.error("Visual aid generation failed:", error);
    return '';
  }
};

export const analyzeTranscript = async (transcript: TranscriptItem[]): Promise<Correction[]> => {
  if (!API_KEY || transcript.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  // Update to use the recommended model for text tasks
  const model = 'gemini-3-flash-preview';

  const transcriptText = transcript.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');
  
  const prompt = `
    Analyze the following conversation between an ESL learner (USER) and a tutor (MODEL).
    Identify 3-5 specific mistakes made by the USER (Level 2 errors: minor grammar, awkward phrasing, or vocabulary issues).
    Do NOT flag Level 1 errors (complete misunderstandings) as the tutor handled those live.
    
    Return a JSON array of objects with this schema:
    [{
      "original": "The user's exact sentence or phrase containing the error",
      "better": "A more natural or correct way to say it",
      "explanation": "A very brief (under 10 words) explanation.",
      "type": "grammar" | "vocabulary" | "naturalness"
    }]

    Transcript:
    ${transcriptText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Transcript analysis failed", error);
    return [];
  }
};

export const generateConversationHints = async (transcript: TranscriptItem[]): Promise<ConversationHints | null> => {
  if (!API_KEY || transcript.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-flash-preview';

  // Get last 4 turns for context
  const recentTranscript = transcript.slice(-4).map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');

  const prompt = `
    Based on the following conversation, suggest what the USER could say NEXT to keep the conversation going or answer the tutor.
    Provide hints in 3 levels:
    1. Topic: A generalized direction or topic (2-3 words).
    2. Sentence: A partial sentence starter or useful structure (e.g., "I prefer to...").
    3. Keywords: 2-3 specific English vocabulary words relevant to the topic.

    Conversation:
    ${recentTranscript}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "A short topic suggestion" },
            sentence: { type: Type.STRING, description: "A useful sentence starter" },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 vocabulary words" }
          },
          required: ["topic", "sentence", "keywords"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Hint generation failed", error);
    return null;
  }
};
