import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicImagesDir = path.join(process.cwd(), 'public', 'images');

    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    // Clean filename
    let fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    // If file already exists with same name, make it unique
    let targetPath = path.join(publicImagesDir, fileName);
    let counter = 1;
    while (fs.existsSync(targetPath)) {
      fileName = `${baseName}_${counter}${ext}`;
      targetPath = path.join(publicImagesDir, fileName);
      counter++;
    }

    fs.writeFileSync(targetPath, buffer);

    return NextResponse.json({
      success: true,
      fileName,
      url: `/images/${fileName}`
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}

