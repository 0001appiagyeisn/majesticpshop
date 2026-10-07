import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// Note: This should ideally only be used on the server-side (e.g. Next.js Route Handlers)
// to avoid exposing the API key to the client.

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});
