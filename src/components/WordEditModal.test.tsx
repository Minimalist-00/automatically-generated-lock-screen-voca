import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WordEditModal from './WordEditModal';
import { useStore } from '@/contexts/StoreContext';
import { updateWord } from '@/app/actions/words';

// Mock contexts and actions
jest.mock('@/contexts/StoreContext', () => ({
  useStore: jest.fn()
}));
jest.mock('@/app/actions/words', () => ({
  updateWord: jest.fn()
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('WordEditModal', () => {
  const mockSetWords = jest.fn();
  const mockOnClose = jest.fn();
  const mockWord = {
    id: '1',
    word: 'apple',
    memo: 'A fruit',
    tags: ['food', 'fruit'],
    part_of_speech: 'Noun',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      words: [mockWord],
      setWords: mockSetWords
    });
  });

  it('renders correctly when open and populates fields', () => {
    render(
      <WordEditModal 
        word={mockWord}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Word')).toBeInTheDocument();
    expect(screen.getByDisplayValue('apple')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A fruit')).toBeInTheDocument();
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('fruit')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <WordEditModal 
        word={mockWord}
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls updateWord and setWords on valid submit', async () => {
    (updateWord as jest.Mock).mockResolvedValue({
      ...mockWord,
      word: 'banana'
    });

    render(
      <WordEditModal 
        word={mockWord}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByDisplayValue('apple');
    fireEvent.change(input, { target: { value: 'banana' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateWord).toHaveBeenCalledWith('1', expect.objectContaining({
        word: 'banana',
        memo: 'A fruit',
        tags: ['food', 'fruit']
      }));
      expect(mockSetWords).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
