import { NextResponse } from 'next/server';
import { generateVocaContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { word, meaning } = await request.json();
    if (!word || !meaning) {
      return NextResponse.json({ error: 'Word and meaning are required.' }, { status: 400 });
    }

    const data = await generateVocaContent(word, meaning);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Gemini content generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI content.' },
      { status: 500 }
    );
  }
}
