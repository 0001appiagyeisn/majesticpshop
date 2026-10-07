const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function run() {
  const models = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.8-flash'];
  for (const m of models) {
    try {
      console.log('Testing', m, '...');
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Hello in one word'
      });
      console.log('SUCCESS with', m, ':', res.text.trim());
      break;
    } catch (err) {
      console.log(m, 'error:', err.status || err.message);
    }
  }
}

run();

