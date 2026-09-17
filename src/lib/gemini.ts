import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export async function classifyPartOfSpeech(word: string): Promise<string> {
  const prompt = `Classify the part of speech for the following English word, phrase, or sentence: "${word}".
Return ONLY the classification as a short string (e.g., "Noun", "Verb", "Adjective", "Adverb", "Preposition", "Phrase", "Sentence"). Do not include any other text or explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || 'Unknown';
    // Clean up any potential markdown ticks or newlines
    return text.replace(/^```.*/g, '').replace(/```$/g, '').trim();
  } catch (error) {
    console.error('Failed to classify part of speech:', error);
    return 'Unknown';
  }
}

export interface ParsedWord {
  word: string;
  memo?: string;
  part_of_speech: string;
}

export async function parseMultiWords(text: string): Promise<ParsedWord[]> {
  const prompt = `You are a helpful AI assistant that extracts English learning vocabulary from unstructured text.
The user will provide a dump of text containing words, phrases, or sentences they want to learn, along with optional memos.
Your task is to parse this text and return a JSON array of objects.

Follow these rules:
1. Each object should represent a single learning item (word, phrase, or sentence).
2. Extract the exact English word, phrase, or sentence and put it in the "word" field.
   - IMPORTANT: If there are multiple variants separated by slashes (e.g., "Oh shit! / Damn it!" or "Right / Left / Mid"), keep them together as one string in the "word" field exactly as the user wrote them.
   - Preserve placeholders like "[ブキ名]" or "~" in the "word" field if they are present.
3. If there is any explanation, translation, Japanese text, or note, put it in the "memo" field.
   - Ignore section headers, categories, or numbering (e.g., "1. ゲーム内のコール・報告").
4. Classify the part of speech for the item and put it in the "part_of_speech" field (e.g., "Noun", "Verb", "Phrase", "Sentence").
5. The output must be ONLY a valid JSON array of objects. Do not include markdown code block formatting (\`\`\`json) or any other text.

JSON format example:
[
  { "word": "Oh shit! / Damn it!", "memo": "くそっ！（やられた時）", "part_of_speech": "Phrase" },
  { "word": "Right / Left / Mid + [ブキ名]", "memo": "右/左/中央に〜がいる", "part_of_speech": "Phrase" }
]

User Text:
"""
${text}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = response.text?.trim() || '[]';
    const jsonStr = responseText.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
    
    return JSON.parse(jsonStr) as ParsedWord[];
  } catch (error) {
    console.error('Failed to parse multi words:', error);
    return [];
  }
}
