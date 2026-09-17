import { NextResponse } from 'next/server';
import { classifyPartOfSpeech } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();
    if (!word) {
      return NextResponse.json({ error: 'Word is required.' }, { status: 400 });
    }

    const partOfSpeech = await classifyPartOfSpeech(word);
    return NextResponse.json({ part_of_speech: partOfSpeech });
  } catch (error: any) {
    console.error('Gemini POS classification failed:', error);
    return NextResponse.json(
      { error: 'Failed to classify part of speech.' },
      { status: 500 }
    );
  }
}
