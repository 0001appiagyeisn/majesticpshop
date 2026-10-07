const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';
const ai = new GoogleGenAI({ apiKey });

async function checkLogos() {
  const logos = ['logo1.jpeg', 'logo2.jpg', 'logo3.jpg'];
  for (const name of logos) {
    const buf = fs.readFileSync('public/images/' + name);
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        { role: 'user', parts: [
          { text: 'Describe what this logo or image is in 10 words' },
          { inlineData: { data: buf.toString('base64'), mimeType: name.endsWith('png') ? 'image/png' : 'image/jpeg' } }
        ]}
      ]
    });
    console.log(name, '=>', res.text.trim());
  }
}

checkLogos();

