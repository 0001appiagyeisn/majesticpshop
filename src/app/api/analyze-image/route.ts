import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

// Known item catalogue with default prices
const catalogItems = [
  { baseName: "Club hoodie", category: "Hoodies", defaultPrice: 150, requiresSize: true, requiresColor: true },
  { baseName: "Majestic Peacock shirt", category: "Shirts", defaultPrice: 100, requiresSize: true, requiresColor: true },
  { baseName: "Majestic Peachick shirt", category: "Shirts", defaultPrice: 100, requiresSize: true, requiresColor: true },
  { baseName: "Club neckerchief", category: "Neckerchiefs & Slides", defaultPrice: 65, requiresSize: false, requiresColor: false },
  { baseName: "Peacock neckerchief", category: "Neckerchiefs & Slides", defaultPrice: 65, requiresSize: false, requiresColor: false },
  { baseName: "Peachick neckerchief", category: "Neckerchiefs & Slides", defaultPrice: 65, requiresSize: false, requiresColor: false },
  { baseName: "Club neckerchief slide", category: "Neckerchiefs & Slides", defaultPrice: 30, requiresSize: false, requiresColor: false },
  { baseName: "Peacock neckerchief slide", category: "Neckerchiefs & Slides", defaultPrice: 30, requiresSize: false, requiresColor: false },
  { baseName: "Peachick neckerchief slide", category: "Neckerchiefs & Slides", defaultPrice: 30, requiresSize: false, requiresColor: false },
  { baseName: "Club Cap", category: "Caps & Crests", defaultPrice: 50, requiresSize: false, requiresColor: true },
  { baseName: "Club bottle", category: "Accessories", defaultPrice: 150, requiresSize: false, requiresColor: false },
  { baseName: "Peacock name tag", category: "Tags & Pins", defaultPrice: 15, requiresSize: false, requiresColor: false },
  { baseName: "Peachick name tag", category: "Tags & Pins", defaultPrice: 15, requiresSize: false, requiresColor: false },
  { baseName: "Peacock Cap crest", category: "Caps & Crests", defaultPrice: 20, requiresSize: false, requiresColor: false },
  { baseName: "Peachick Cap crest", category: "Caps & Crests", defaultPrice: 20, requiresSize: false, requiresColor: false },
  { baseName: "Club pin", category: "Tags & Pins", defaultPrice: 15, requiresSize: false, requiresColor: false },
  { baseName: "Shoulder tag (Peacock and Peachick)", category: "Tags & Pins", defaultPrice: 25, requiresSize: false, requiresColor: false },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageName } = body;

    if (!imageName) {
      return NextResponse.json({ error: 'Image name is required' }, { status: 400 });
    }

    const imagePath = path.join(process.cwd(), 'public', 'images', imageName);
    
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageName.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Auto-detect companion "b" image (e.g. p15.jpeg -> p15b.jpeg)
    let secondaryImage: string | null = null;
    const ext = path.extname(imageName);
    const baseName = path.basename(imageName, ext);
    if (!baseName.endsWith('b')) {
      const companionName = `${baseName}b${ext}`;
      const companionPath = path.join(process.cwd(), 'public', 'images', companionName);
      if (fs.existsSync(companionPath)) {
        secondaryImage = companionName;
      }
    }

    const prompt = `
      You are an expert AI recognition assistant for the Majesty Peacock Pathfinder Club shop.
      
      CRITICAL INSTRUCTION - VISUAL MASCOT / UNIT IDENTIFICATION:
      Our club has 3 specialized units plus a general club-wide tier:
      1. **Capricorn Unit**: Signified by a GOAT, HORNED CREATURE, RAM, or SEA-GOAT graphic/mascot printed or embroidered on the item! If you see a goat or horns, it is 100% CAPRICORN!
      2. **Tiger Unit**: Signified by a TIGER, TIGER STRIPES, TIGER HEAD, or FELINE graphic/mascot!
      3. **Chrysanthemum Unit**: Signified by a CHRYSANTHEMUM FLOWER or FLORAL emblem!
      4. **General**: Signified by a PEACOCK, PEACHICK, PEACOCK FEATHERS, or standard club regalia/crest.

      ITEM TYPE RECOGNITION:
      - Hoodies / Pullovers / Sweaters -> Category: "Hoodies", Default price: 150 GHC
      - T-Shirts / Collared Shirts -> Category: "Shirts", Default price: 100 GHC
      - Neckerchiefs / Scarf -> Category: "Neckerchiefs & Slides", Default price: 65 GHC
      - Neckerchief Slides / Woggles -> Category: "Neckerchiefs & Slides", Default price: 30 GHC
      - Baseball Caps / Berets / Crests -> Category: "Caps & Crests", Default price: 50 GHC (crest: 20 GHC)
      - Water bottles -> Category: "Accessories", Default price: 150 GHC
      - Badges / Pins / Name tags -> Category: "Tags & Pins", Default price: 15 - 25 GHC

      NAMING & DESCRIPTION CONVENTION:
      - If the item belongs to a specific unit (Capricorn, Tiger, or Chrysanthemum), include the unit in the name and description:
        Example name: "Club hoodie - Capricorn" or "Club neckerchief - Capricorn" or "Club hoodie - Tiger".
        If General: "Majestic Peacock shirt" or "Peacock neckerchief".
      - Description: Write a clear sentence containing the item type and unit, e.g.:
        "Official club hoodie for Capricorn Unit, featuring the Capricorn goat mascot emblem."

      Return ONLY a pure raw JSON object with NO markdown backticks:
      {
        "name": "Product Name with Unit (e.g. Club hoodie - Capricorn)",
        "unit": "Capricorn" | "Tiger" | "Chrysanthemum" | "General",
        "description": "Short description mentioning unit like: Club hoodie - Capricorn. Official regalia...",
        "category": "Shirts" | "Hoodies" | "Neckerchiefs & Slides" | "Caps & Crests" | "Tags & Pins" | "Accessories",
        "price": number,
        "requiresSize": boolean,
        "requiresColor": boolean
      }
    `;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash'];
    let responseText = '';
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                  }
                }
              ]
            }
          ]
        });
        if (result?.text) {
          responseText = result.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} error in analyze-image:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to get response from Gemini API");
    }

    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const data = JSON.parse(cleaned);

    if (secondaryImage) {
      data.secondaryImage = secondaryImage;
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in analyze-image API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
