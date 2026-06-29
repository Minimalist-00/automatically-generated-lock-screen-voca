import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export interface GeneratedCandidate {
  scene: string;
  example: string;
}

export interface GeneratedVocaContent {
  meaning: string;
  candidates: GeneratedCandidate[];
}

export interface BulkGeneratedWord {
  word: string;
  meaning: string;
  candidates: { scene: string; example: string }[];
}

export async function generateBulkWordsContent(rawText: string, existingWords: string[] = []): Promise<BulkGeneratedWord[]> {
  const existingWordsInstruction = existingWords.length > 0
    ? `\n### 除外ルール (既存単語との重複排除)
以下のリストは、すでにデータベースに登録されている単語です。
テキストから単語を抽出する際、以下のリストにある単語と「同一」または「実質的に同じ（表記揺れ、複数形/単数形、過去形などの変化形、大文字/小文字の違い、あるいは極めて近い類義語）」と判断される単語は、絶対に抽出リスト（JSON）から除外してください。

既存の単語リスト:
${JSON.stringify(existingWords)}
`
    : '';

  const prompt = `### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中、生粋のゲーマーで、語学学校の友人や先生とよく話をする）の専属英語コーチです。

以下のテキストは、ユーザーがなぐり書きした単語リストやメモです。
テキストから単語やフレーズを抽出し、以下の情報を推測または生成してJSON配列として返してください。
もしユーザーのメモに意味、シチュエーション（シーン）、例文が含まれていれば、それを優先して採用し、
不足している項目があれば、Neoのペルソナに沿って（ドヤ顔で放てる、ゲーマーや若者っぽいカジュアルな表現を意識して）あなたが生成して補完してください。
${existingWordsInstruction}
【重要ルール】
- 各単語につき、異なるシチュエーションの候補を3つ生成してください。
- 各候補の "scene" と "example" は【必ず同じシチュエーション】に基づいてください。sceneが「ゲーム中に仲間を褒める」なら、exampleもそのゲーム中のシーンでの例文にしてください。sceneとexampleがちぐはぐだと「え？どこのシーンでこの例文使えばいいの？」となるので、絶対に一致させてください。
- sceneは最大30文字以内で、状況説明は極力省き「いやそれな！」「まじかよ！」など口語表現メインに。

対象のテキスト:
"""
${rawText}
"""

以下のJSONフォーマットの配列のみを返してください。余計なテキストやマークダウンは含めないでください。
[
  {
    "word": "抽出した英単語やフレーズ",
    "meaning": "日本語の意味",
    "candidates": [
      {
        "scene": "使うシーンと感情・ニュアンス（最大30文字以内）",
        "example": "そのシーンでのリアルで感情が乗った極めて短い例文と日本語訳"
      },
      {
        "scene": "別のシーン（最大30文字以内）",
        "example": "そのシーンでの例文と日本語訳"
      },
      {
        "scene": "さらに別のシーン（最大30文字以内）",
        "example": "そのシーンでの例文と日本語訳"
      }
    ]
  }
]`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  const text = response.text?.trim() || '[]';
  const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
  
  return JSON.parse(cleanText) as BulkGeneratedWord[];
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

以下の要素を含むJSONデータを生成してください。
- "meaning": 日本語の意味。提供されている場合はそのまま出力し、提供されていない場合はあなたが生成してください。
- "candidates": 異なるシチュエーションやニュアンスを持つ3つの例文候補の配列。各候補は以下の2点を含みます。
  - "scene": 使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「いやそれな！」「まじかよ！」など、Neoのバイブスに合う日本語の口語表現メインに。長文禁止。提供されている場合はそのまま出力してください。
  - "example": そのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語1文、日本語訳1文のみ。提供されている場合はそのまま出力してください。

レスポンスは以下のJSONフォーマットのみを返してください。余計なマークダウン（\`\`\`jsonなど）やテキストは一切含めないでください。
{
  "meaning": "...",
  "candidates": [
    {
      "scene": "...",
      "example": "..."
    },
    {
      "scene": "...",
      "example": "..."
    },
    {
      "scene": "...",
      "example": "..."
    }
  ]
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
