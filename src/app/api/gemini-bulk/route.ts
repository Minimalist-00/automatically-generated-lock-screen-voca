import { NextResponse } from 'next/server';
import { generateBulkWordsContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    const data = await generateBulkWordsContent(text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Gemini bulk content generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate bulk AI content.' },
      { status: 500 }
    );
  }
}
