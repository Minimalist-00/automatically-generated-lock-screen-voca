import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WordsPage from './page';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({
    draggableProps: {},
    innerRef: (el: any) => {},
    droppableProps: {}
  }, { isDraggingOver: false }),
  Draggable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: (el: any) => {}
  }, { isDragging: false }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockSetWords = jest.fn();
const mockSetTodayQuest = jest.fn();
const mockWords = [
  { id: '1', word: 'apple', meaning: 'りんご', is_archived: false, is_priority: false, sort_order: 1 },
  { id: '2', word: 'banana', meaning: 'バナナ', is_archived: false, is_priority: false, sort_order: 2 },
  { id: '3', word: 'cherry', meaning: 'さくらんぼ', is_archived: false, is_priority: false, sort_order: 3 },
  { id: '4', word: 'durian', meaning: 'ドリアン', is_archived: false, is_priority: false, sort_order: 4 },
];

jest.mock('@/contexts/StoreContext', () => ({
  useStore: jest.fn()
}));

// Mock components that might cause issues in jsdom or aren't relevant to this test
jest.mock('@/components/PageHeader', () => () => <div data-testid="page-header" />);
jest.mock('@/components/TTSButton', () => () => <button data-testid="tts-button">TTS</button>);
jest.mock('@/components/SortableWordItem', () => ({ word, isSelected, onToggleSelect }: any) => (
  <div data-testid={`word-item-${word.id}`}>
    <span>{word.word}</span>
    <button data-testid={`toggle-${word.id}`} onClick={onToggleSelect}>
      {isSelected ? 'Selected' : 'Unselected'}
    </button>
  </div>
));

describe('WordsPage - Word Selection Limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as jest.Mock).mockReturnValue({
      words: mockWords,
      setWords: mockSetWords,
      loading: false,
      todayQuest: null,
      setTodayQuest: mockSetTodayQuest,
    });
  });

  it('should allow selecting up to 3 words and show error on 4th selection', async () => {
    render(<WordsPage />);

    const toggle1 = screen.getByTestId('toggle-1');
    const toggle2 = screen.getByTestId('toggle-2');
    const toggle3 = screen.getByTestId('toggle-3');
    const toggle4 = screen.getByTestId('toggle-4');

    // Select 3 words
    fireEvent.click(toggle1);
    fireEvent.click(toggle2);
    
    // Expecting to be able to click the 3rd one without error
    fireEvent.click(toggle3);

    // It should NOT call toast.error for the 3rd item
    expect(toast.error).not.toHaveBeenCalled();

    // Now clicking the 4th one should show the error toast
    fireEvent.click(toggle4);
    expect(toast.error).toHaveBeenCalledWith('You can select up to 3 words.');
  });
});
