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

- "scene": 使うシーンと感情・ニュアンスを簡潔に。語学学校の友だちや先生とどんな場面で使うかを具体的にしつつ、「いやそれな！！」「ぶっちゃけさ」など、Neoのバイブスに合う日本語の口語表現で一言（長すぎないように）。
- "example": そのシーンでNeoが口にしている、リアルで感情が乗った短い例文と、その日本語訳（改行を入れて表示しやすい形にしてください）。

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
