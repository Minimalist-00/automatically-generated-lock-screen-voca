import { NextResponse } from 'next/server';
import { generateBulkWordsContent } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    // データベースから既存単語のリストを一括取得
    const { data: wordsData, error: dbError } = await supabase
      .from('words')
      .select('word');

    if (dbError) {
      console.error('Failed to fetch existing words from database:', dbError);
    }

    const existingWords = wordsData ? wordsData.map((w: { word: string }) => w.word.trim()) : [];

    // AIに既存単語リストを渡して、重複しないように抽出してもらう
    const data = await generateBulkWordsContent(text, existingWords);

    // プログラム側でも念のため完全一致する単語を除外（大文字小文字を区別しない）
    const existingWordsSet = new Set(existingWords.map(w => w.toLowerCase()));
    const uniqueData = data.filter(item => {
      const isDuplicate = existingWordsSet.has(item.word.trim().toLowerCase());
      if (isDuplicate) {
        console.log(`[Duplicate Filter] Removed duplicate word: "${item.word}"`);
      }
      return !isDuplicate;
    });

    return NextResponse.json(uniqueData);
  } catch (error: any) {
    console.error('Gemini bulk content generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate bulk AI content.' },
      { status: 500 }
    );
  }
}
