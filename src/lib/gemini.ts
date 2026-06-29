import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export interface GeneratedVocaContent {
  scene: string;
  example: string;
}

export async function generateVocaContent(word: string, meaning: string): Promise<GeneratedVocaContent> {
  const prompt = `### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中、生粋のゲーマーで、語学学校の友人や先生とよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

英単語「${word}」（意味: ${meaning}）について、以下の2点を含むJSONデータを生成してください。

- "scene": 使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「いやそれな！」「まじかよ！」など、Neoのバイブスに合う日本語の口語表現メインにしてください。絶対に長文にしないでください。
- "example": そのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語1文、日本語訳1文のみとし、長々とした説明は省いてください。（改行を入れて表示しやすい形にしてください）。

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
