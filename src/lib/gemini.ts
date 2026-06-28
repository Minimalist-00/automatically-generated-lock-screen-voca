import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export interface GeneratedVocaContent {
  scene: string;
  example: string;
}

export async function generateVocaContent(word: string, meaning: string): Promise<GeneratedVocaContent> {
  const prompt = `あなたは優秀な英語教師です。英単語「${word}」（意味: ${meaning}）について、以下の2点を含むJSONデータを生成してください。
- "scene": その単語が日常生活やビジネスで使える具体的なシーン（日本語で15文字以内、例: 「カフェでの注文時」「ビジネス会議」など）
- "example": その単語を使った実用的な英語の例文と日本語訳（1フレーズまたは1文。改行を入れて表示しやすい形にしてください）

レスポンスは以下のJSONフォーマットのみを返してください。余計なマークダウン（\`\`\`jsonなど）やテキストは一切含めないでください。
{
  "scene": "...",
  "example": "..."
}`;

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
