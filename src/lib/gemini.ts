import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export interface GeneratedVocaContent {
  meaning: string;
  scene: string;
  example: string;
}

import { supabase } from './supabase';

const defaultPrompt = `### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中、生粋のゲーマーで、語学学校の友人や先生とよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

英単語「{{word}}」について、以下のJSONデータを生成してください。
ただし、すでに提供されている情報がある場合はそれをそのまま使用し、不足している情報（空欄の項目）のみを新しく生成して補完してください。

提供されている情報:
- 意味: {{meaning}}
- シーン: {{scene}}
- 例文: {{example}}

以下の3点を含むJSONデータを生成してください。
- "meaning": 日本語の意味。提供されている場合はそのまま出力し、提供されていない場合はあなたが生成してください。
- "scene": 使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「いやそれな！」「まじかよ！」など、Neoのバイブスに合う日本語の口語表現メインに。長文禁止。提供されている場合はそのまま出力してください。
- "example": そのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語1文、日本語訳1文のみ。提供されている場合はそのまま出力してください。

レスポンスは以下のJSONフォーマットのみを返してください。余計なマークダウン（\`\`\`jsonなど）やテキストは一切含めないでください。
{
  "meaning": "...",
  "scene": "...",
  "example": "..."
}`;

export async function generateVocaContent(word: string, meaning: string = '', scene: string = '', example: string = ''): Promise<GeneratedVocaContent> {
  let promptTemplate = defaultPrompt;

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'generation_prompt')
      .single();

    if (data && !error) {
      promptTemplate = data.value;
    }
  } catch (err) {
    console.error('Failed to fetch prompt from Supabase:', err);
  }

  const prompt = promptTemplate
    .replace(/\{\{word\}\}/g, word)
    .replace(/\{\{meaning\}\}/g, meaning || '（指定なし）')
    .replace(/\{\{scene\}\}/g, scene || '（指定なし）')
    .replace(/\{\{example\}\}/g, example || '（指定なし）');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  const text = response.text?.trim() || '{}';
  // markdown block ticks remover in case Gemini returned it despite instructions
  const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
  
  return JSON.parse(cleanText) as GeneratedVocaContent;
}
