import { getCommonPersona, generateVocaContent, ai } from './gemini';
import { prisma } from './prisma';
import { defaultPersonaPrompt } from './constants';

// Mock prisma
jest.mock('./prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: jest.fn().mockResolvedValue({
        value: 'Mocked persona prompt'
      })
    }
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
    it('should fetch the persona prompt from Prisma', async () => {
      const prompt = await getCommonPersona();
      expect(prompt).toBe('Mocked persona prompt');
      expect(prisma.systemSetting.findUnique).toHaveBeenCalledWith({ where: { key: 'generation_prompt' } });
    });

    it('should return default persona if Prisma fails', async () => {
      // Override mock to simulate an error
      (prisma.systemSetting.findUnique as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));
      
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
