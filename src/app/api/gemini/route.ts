import { NextResponse } from 'next/server';
import { generateVocaContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { word, meaning } = await request.json();
    if (!word || !meaning) {
      return NextResponse.json({ error: '単語と意味は必須項目です。' }, { status: 400 });
    }

    const data = await generateVocaContent(word, meaning);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Gemini content generation failed:', error);
    return NextResponse.json(
      { error: 'AIコンテンツの生成に失敗しました。' },
      { status: 500 }
    );
  }
}
