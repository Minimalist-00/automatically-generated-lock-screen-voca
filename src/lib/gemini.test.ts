import { getCommonPersona, generateVocaContent, ai } from './gemini';
import { supabase } from './supabase';
import { defaultPersonaPrompt } from './constants';

// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { value: 'Mocked persona prompt' },
        error: null
      })
    }))
  }
}));

// Mock Google Gen AI
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn()
      }
    }))
  };
});

describe('gemini.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommonPersona', () => {
    it('should fetch the persona prompt from Supabase', async () => {
      const prompt = await getCommonPersona();
      expect(prompt).toBe('Mocked persona prompt');
      expect(supabase.from).toHaveBeenCalledWith('system_settings');
    });

    it('should return default persona if Supabase fails', async () => {
      // Override mock to simulate an error
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('DB Error'))
      }));
      
      const prompt = await getCommonPersona();
      // Should gracefully catch the error and return the default prompt
      expect(prompt).toBe(defaultPersonaPrompt);
    });
  });

  describe('generateVocaContent', () => {
    it('should parse the JSON response correctly', async () => {
      const mockJsonResponse = {
        meaning: 'テスト',
        part_of_speech: 'Noun',
        candidates: [
          { scene: '先生', example: 'Hello teacher' },
          { scene: '先生2', example: 'Hello teacher 2' },
          { scene: '友達', example: 'Hi friend' },
          { scene: '友達2', example: 'Hi friend 2' }
        ]
      };

      (ai.models.generateContent as jest.Mock).mockResolvedValueOnce({
        text: JSON.stringify(mockJsonResponse)
      });

      const result = await generateVocaContent('test');
      
      expect(result.meaning).toBe('テスト');
      expect(result.part_of_speech).toBe('Noun');
      expect(result.candidates).toHaveLength(4);
      expect(result.candidates[0].scene).toBe('先生');
      
      expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should strip markdown code blocks if gemini returns them', async () => {
      const mockJsonResponse = {
        meaning: 'テストコード',
        candidates: []
      };
      
      // Simulate Gemini returning ```json ... ``` wrapper
      const markdownWrapped = `\`\`\`json\n${JSON.stringify(mockJsonResponse)}\n\`\`\``;

      (ai.models.generateContent as jest.Mock).mockResolvedValueOnce({
        text: markdownWrapped
      });

      const result = await generateVocaContent('test');
      expect(result.meaning).toBe('テストコード');
    });
  });
});
