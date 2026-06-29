import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export const defaultPersonaPrompt = `### AIのペルソナ
あなたはNeo（23歳、現在フィリピン留学中。語学学校の先生や友人たちとよく話をする）の専属英語コーチです。教科書的な退屈な英語ではなく、Neoが明日から授業や日常会話で「ドヤ顔で放てる必殺技」として脳にインプットできる言葉選びをしてください。

### シーン（Usage Scene）の指定ルール
- 例文のシチュエーションは、「フィリピンの語学学校の授業で先生に質問・発言するシーン」や「学校の友達とカフェやドミトリーで雑談する日常会話シーン」をメインに設定してください。ゲームなどの偏ったシチュエーションは避けてください。
- 各単語につき、異なるシチュエーションの候補を【必ず4つ】生成してください。
- 4つの候補の内訳は必ず以下の通りにしてください：
  - 1つ目と2つ目の候補: 語学学校の授業中に「先生」に対して使える丁寧な表現や質問シーン。
  - 3つ目と4つ目の候補: 寮（ドミトリー）やカフェなどで「友達」に対して使えるカジュアルな雑談シーン。
- 各候補の "scene" と "example" は【必ず同じシチュエーション】に基づいてください。sceneが「授業中に先生に質問する」なら、exampleもその授業中での例文にしてください。sceneとexampleがちぐはぐにならないよう、絶対に一致させてください。
- sceneは使うシーンと感情・ニュアンスを【最大30文字以内】で超一言で。状況説明は極力省き、「先生に質問する時」「友達と週末の予定を話す時」など、具体的かつ簡潔な日本語表現にしてください。
- exampleはそのシーンでNeoが口にしている、リアルで感情が乗った【極めて短い例文】とその日本語訳。英語1文、日本語訳1文のみ。`;

export async function getCommonPersona(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'generation_prompt')
      .single();

    if (data && !error && data.value.trim() !== '') {
      return data.value;
    }
  } catch (err) {
    console.error('Failed to fetch prompt from Supabase:', err);
  }
  return defaultPersonaPrompt;
}

export interface GeneratedCandidate {
  scene: string;
  example: string;
}

export interface GeneratedVocaContent {
  meaning: string;
  part_of_speech?: string;
  candidates: GeneratedCandidate[];
}

export interface BulkGeneratedWord {
  word: string;
  meaning: string;
  part_of_speech?: string;
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

  const commonPersona = await getCommonPersona();

  const prompt = `${commonPersona}

### 固有の指示
以下のテキストは、ユーザーがなぐり書きした単語リストやメモです。
テキストから単語やフレーズを抽出し、以下の情報を推測または生成してJSON配列として返してください。
もしユーザーのメモに意味、シチュエーション（シーン）、例文が含まれていれば、それを優先して採用し、
不足している項目があれば、上記のペルソナおよびルールに沿ってあなたが生成して補完してください。
${existingWordsInstruction}
【重要ルール】
- 各単語につき、異なるシチュエーションの候補を【必ず4つ】生成してください（上2つは先生用、下2つは友達用）。
- 各単語の品詞（"Noun", "Verb", "Adj", "Adv", "Prep", "Phrase" などの短い英語表記）を判定し、"part_of_speech" に設定してください。

対象のテキスト:
"""
${rawText}
"""

以下のJSONフォーマット의 配列のみを返してください。余計なテキストやマークダウンは含めないでください。
[
  {
    "word": "抽出した英単語やフレーズ",
    "meaning": "日本語の意味",
    "part_of_speech": "品詞（Noun, Verb, Adj, Adv, Prep, Phrase などの短い英語）",
    "candidates": [
      {
        "scene": "先生に使えるシーン（最大30文字以内）",
        "example": "先生向けのリアルで感情が乗った極めて短い例文と日本語訳"
      },
      {
        "scene": "先生に使える別のシーン（最大30文字以内）",
        "example": "先生向けの例文と日本語訳"
      },
      {
        "scene": "友達に使えるシーン（最大30文字以内）",
        "example": "友達向けの例文と日本語訳"
      },
      {
        "scene": "友達に使える別のシーン（最大30文字以内）",
        "example": "友達向けの例文と日本語訳"
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

export async function generateVocaContent(word: string, meaning: string = '', scene: string = '', example: string = '', partOfSpeech: string = ''): Promise<GeneratedVocaContent> {
  const commonPersona = await getCommonPersona();

  const promptTemplate = `${commonPersona}

### 固有の指示
英単語「{{word}}」について、以下のJSONデータを生成してください。
ただし、すでに提供されている情報がある場合はそれをそのまま使用し、不足している情報（空欄の項目）のみを新しく生成して補完してください。

提供されている情報:
- 意味: {{meaning}}
- 品詞: {{part_of_speech}}
- シーン: {{scene}}
- 例文: {{example}}

以下の要素を含むJSONデータを生成してください。
- "meaning": 日本語の意味。提供されている場合はそのまま出力し、提供されていない場合はあなたが生成してください。
- "part_of_speech": 該当する品詞（"Noun", "Verb", "Adj", "Adv", "Prep", "Phrase" などの短い英語表記）。提供されている場合はそのまま出力し、提供されていない場合はあなたが生成してください。
- "candidates": 異なるシチュエーションやニュアンスを持つ4つの例文候補の配列（上2つは先生用、下2つは友達用）。各候補は "scene" と "example" を含みます。

レスポンスは以下のJSONフォーマットのみを返してください。余計なマークダウン（\`\`\`jsonなど）やテキストは一切含めないでください。
{
  "meaning": "...",
  "part_of_speech": "...",
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
    },
    {
      "scene": "...",
      "example": "..."
    }
  ]
}`;

  const prompt = promptTemplate
    .replace(/\{\{word\}\}/g, word)
    .replace(/\{\{meaning\}\}/g, meaning || '（指定なし）')
    .replace(/\{\{part_of_speech\}\}/g, partOfSpeech || '（指定なし）')
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
