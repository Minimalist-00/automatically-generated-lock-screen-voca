import { NextResponse } from 'next/server';
import { parseMultiWords } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    const parsedWords = await parseMultiWords(text);
    return NextResponse.json({ parsedWords });
  } catch (error: any) {
    console.error('Gemini multi parse failed:', error);
    return NextResponse.json(
      { error: 'Failed to parse text.' },
      { status: 500 }
    );
  }
}
