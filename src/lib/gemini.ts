import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';
import { defaultPersonaPrompt } from './constants';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export { defaultPersonaPrompt };

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

import { GeneratedCandidate, GeneratedVocaContent, BulkGeneratedWord } from '@/types';

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
- 抽出した単語は同義語などに言い換えたりせず、入力テキストにある単語を優先して基本的にそのまま使用してください。ただし、明らかなスペルミス（誤字）がある場合のみ、正しいスペルに修正して使用してください。
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
        "example": "先生向けのリアルで感情が乗った極めて短い例文（日本語訳）"
      },
      {
        "scene": "先生に使える別のシーン（最大30文字以内）",
        "example": "先生向けの極めて短い例文（日本語訳）"
      },
      {
        "scene": "友達に使えるシーン（最大30文字以内）",
        "example": "友達向けの極めて短い例文（日本語訳）"
      },
      {
        "scene": "友達に使える別のシーン（最大30文字以内）",
        "example": "友達向けの極めて短い例文（日本語訳）"
      }
    ]
  }
]`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  const text = response.text?.trim() || '[]';
  const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
  
  return JSON.parse(cleanText) as BulkGeneratedWord[];
}

export async function generateVocaContent(word: string, meaning: string = '', scene: string = '', example: string = '', partOfSpeech: string = '', customPrompt?: string): Promise<GeneratedVocaContent> {
  const commonPersona = customPrompt || await getCommonPersona();

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
  - 【注意】対象の英単語「{{word}}」は決して同義語に言い換えず、基本的にそのまま使用してください。ただし、明らかなスペルミス（誤字）がある場合のみ、正しいスペルに修正して使用してください。
  - 【注意】exampleは「英語の例文（日本語訳）」の形式で記述し、例文は極めて短く（3〜7語程度）してください。

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
    model: 'gemini-3.5-flash',
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
