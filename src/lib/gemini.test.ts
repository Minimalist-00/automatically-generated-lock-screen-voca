import { classifyPartOfSpeech, ai } from './gemini';

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

  describe('classifyPartOfSpeech', () => {
    it('should return the classified part of speech', async () => {
      (ai.models.generateContent as jest.Mock).mockResolvedValueOnce({
        text: 'Noun'
      });

      const result = await classifyPartOfSpeech('apple');
      expect(result).toBe('Noun');
    });

    it('should strip markdown code blocks if gemini returns them', async () => {
      (ai.models.generateContent as jest.Mock).mockResolvedValueOnce({
        text: '```\nVerb\n```'
      });

      const result = await classifyPartOfSpeech('run');
      expect(result).toBe('Verb');
    });

    it('should handle errors gracefully', async () => {
      (ai.models.generateContent as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await classifyPartOfSpeech('test');
      expect(result).toBe('Unknown');
    });
  });
});
