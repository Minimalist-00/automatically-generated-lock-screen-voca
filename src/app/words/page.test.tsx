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

jest.mock('@/app/actions/quests', () => ({
  upsertTodayQuest: jest.fn().mockImplementation(async (word_ids) => ({ word_ids })),
}));

jest.mock('@/app/actions/words', () => ({
  updateWord: jest.fn().mockResolvedValue({}),
  addWord: jest.fn().mockResolvedValue({}),
  deleteWord: jest.fn().mockResolvedValue({}),
  addWords: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/app/actions/systemSettings', () => ({
  getSystemSettings: jest.fn().mockResolvedValue([]),
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
  it('should allow selecting up to 3 words and show error on 4th selection', async () => {
    // We need to implement a small stateful mock for useStore
    let currentQuest: any = { word_ids: [] };
    let listeners: any[] = [];
    
    (useStore as jest.Mock).mockImplementation(() => {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        listeners.push(setTick);
        return () => { listeners = listeners.filter(l => l !== setTick); };
      }, []);

      return {
        words: mockWords,
        setWords: mockSetWords,
        loading: false,
        todayQuest: currentQuest,
        setTodayQuest: (q: any) => { 
          currentQuest = q; 
          listeners.forEach(l => l((prev: number) => prev + 1));
        },
      };
    });

    render(<WordsPage />);

    const toggle1 = screen.getByTestId('toggle-1');
    const toggle2 = screen.getByTestId('toggle-2');
    const toggle3 = screen.getByTestId('toggle-3');
    const toggle4 = screen.getByTestId('toggle-4');

    // Select 3 words sequentially and wait for state updates
    fireEvent.click(toggle1);
    await screen.findByText('Selected: 1 / 3');
    
    fireEvent.click(toggle2);
    await screen.findByText('Selected: 2 / 3');
    
    fireEvent.click(toggle3);
    await screen.findByText('Selected: 3 / 3');

    expect(toast.error).not.toHaveBeenCalled();

    // Now clicking the 4th one should show the error toast
    fireEvent.click(toggle4);
    expect(toast.error).toHaveBeenCalledWith('You can only select up to 3 items for the home screen.');
  });
});
