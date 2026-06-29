import { NextResponse } from 'next/server';
import { generateVocaContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { word, meaning, scene, example, part_of_speech } = await request.json();
    if (!word) {
      return NextResponse.json({ error: 'Word is required.' }, { status: 400 });
    }

    const data = await generateVocaContent(word, meaning || '', scene || '', example || '', part_of_speech || '');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Gemini content generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI content.' },
      { status: 500 }
    );
  }
}
