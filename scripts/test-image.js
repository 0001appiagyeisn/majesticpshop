const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';
const ai = new GoogleGenAI({ apiKey });

async function findWorkingModel() {
  const buf = fs.readFileSync('public/images/p1.jpeg');
  const base64 = buf.toString('base64');
  const candidates = [
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash'
  ];

  for (const model of candidates) {
    try {
      console.log('Trying model:', model);
      const res = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: 'What is this item in 3 words?' }, { inlineData: { data: base64, mimeType: 'image/jpeg' } }] }
        ]
      });
      console.log(`SUCCESS [${model}]:`, res.text.trim());
      return model;
    } catch (e) {
      console.log(`FAILED [${model}]:`, e.status || e.message);
    }
  }
}

findWorkingModel();

