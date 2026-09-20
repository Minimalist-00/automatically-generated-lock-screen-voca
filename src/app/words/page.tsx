'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { updateWord, deleteWord, addWord } from '@/app/actions/words';
import { upsertTodayQuest } from '@/app/actions/quests';
import { useStore } from '@/contexts/StoreContext';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import SortableWordItem from '@/components/SortableWordItem';
import WordEditModal from '@/components/WordEditModal';
import { toast } from 'sonner';
import { Word } from '@/types';

export default function WordsPage() {
  const { words, setWords, loading, todayQuest, setTodayQuest } = useStore();
  const [view, setView] = useState<'all' | 'archived'>('all');
  const [showPriority, setShowPriority] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWords = words.filter(w => {
    if (view === 'archived' && !w.is_archived) return false;
    if (view === 'all' && w.is_archived) return false;
    if (showPriority && !w.is_priority) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchWord = w.word.toLowerCase().includes(q);
      const matchMemo = w.memo?.toLowerCase().includes(q) ?? false;
      const matchTags = w.tags?.some(tag => tag.toLowerCase().includes(q)) ?? false;
      if (!matchWord && !matchMemo && !matchTags) return false;
    }

    return true;
  });

  // Pin selected items to the top
  const displayWords = [
    ...filteredWords.filter(w => todayQuest?.word_ids?.includes(w.id)),
    ...filteredWords.filter(w => !todayQuest?.word_ids?.includes(w.id))
  ];

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const reordered = Array.from(displayWords);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    // Give each item its new index as sort_order
    const updates = reordered.map((w, index) => ({ id: w.id, sort_order: index }));
    
    // Optimistic UI update
    setWords(words.map(w => {
      const idx = reordered.findIndex(r => r.id === w.id);
      return idx !== -1 ? { ...w, sort_order: idx } : w;
    }));

    try {
      await fetch('/api/words/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
    } catch {
      toast.error('Failed to save order.');
    }
  };

  const handleToggleSelect = async (wordId: string) => {
    const isSelected = todayQuest?.word_ids?.includes(wordId) || false;
    let newWordIds = [];
    
    if (isSelected) {
      newWordIds = (todayQuest?.word_ids || []).filter(id => id !== wordId);
    } else {
      if ((todayQuest?.word_ids || []).length >= 3) {
        toast.error('You can only select up to 3 items for the home screen.');
        return;
      }
      newWordIds = [...(todayQuest?.word_ids || []), wordId];
    }

    try {
      const updatedQuest = await upsertTodayQuest(newWordIds);
      if (updatedQuest) setTodayQuest(updatedQuest);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update selection.');
    }
  };

  const handleArchive = async (id: string, current: boolean) => {
    try {
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_archived: !current } : w));
      await updateWord(id, { is_archived: !current });
    } catch {
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_archived: current } : w));
      toast.error('Failed to update.');
    }
  };

  const handlePriority = async (id: string, current: boolean) => {
    try {
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_priority: !current } : w));
      await updateWord(id, { is_priority: !current });
    } catch {
      setWords(prev => prev.map(w => w.id === id ? { ...w, is_priority: current } : w));
      toast.error('Failed to update.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const backup = words;
      setWords(prev => prev.filter(w => w.id !== id));
      const success = await deleteWord(id);
      if (!success) {
        setWords(backup);
        toast.error('Failed to delete.');
      }
    } catch {
      toast.error('Failed to delete.');
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <div>
        <PageHeader title="Library" icon="book" />
      </div>

      <main className="max-w-3xl mx-auto mt-4 md:mt-6">
        <div className="mb-4 md:mb-6">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-rounded absolute left-4 text-foreground/40 pointer-events-none z-10">search</span>
            <input
              type="text"
              placeholder="Search words, memos, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-white/80 backdrop-blur-md border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl shadow-sm text-foreground placeholder:text-foreground/40 font-medium transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-full text-foreground/40 hover:text-foreground hover:bg-black/5 transition-colors"
                title="Clear search"
              >
                <span className="material-symbols-rounded text-[20px]">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div className="flex gap-3 items-center">
            <div className="flex gap-1 bg-white/60 p-1 rounded-xl shadow-sm backdrop-blur-sm">
              <button
                onClick={() => setView('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'all' ? 'bg-white shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground hover:bg-white/40'}`}
              >
                All
              </button>
              <button
                onClick={() => setView('archived')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === 'archived' ? 'bg-white shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground hover:bg-white/40'}`}
              >
                Archived
              </button>
            </div>
            
            <button
              onClick={() => setShowPriority(!showPriority)}
              className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center ${showPriority ? 'bg-amber-100 text-amber-500 shadow-sm' : 'bg-white/60 text-foreground/40 hover:bg-white shadow-sm backdrop-blur-sm'}`}
              title="Filter by Priority"
            >
              <span className={`material-symbols-rounded text-[20px] ${showPriority ? 'icon-filled' : ''}`}>star</span>
            </button>
          </div>
          
          <div className="text-sm font-bold text-foreground/50 bg-white/60 px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-sm">
            Selected: {todayQuest?.word_ids?.length || 0} / 3
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-primary bg-white/50 backdrop-blur-sm rounded-2xl min-h-[50vh] shadow-sm">
            <span className="material-symbols-rounded animate-spin text-4xl">progress_activity</span>
          </div>
        ) : displayWords.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm min-h-[50vh]">
            <span className="material-symbols-rounded text-6xl text-foreground/20 mb-4 block">inbox</span>
            <p className="text-foreground/50 font-medium">No items found.</p>
          </div>
        ) : (
          <div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="words-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-2 md:gap-3"
                  >
                    {displayWords.map((word, index) => (
                      <SortableWordItem
                        key={word.id}
                        word={word}
                        index={index}
                        isSelected={todayQuest?.word_ids?.includes(word.id) || false}
                        onToggleSelect={() => handleToggleSelect(word.id)}
                        onEdit={() => setEditingWord(word)}
                        onArchive={() => handleArchive(word.id, word.is_archived || false)}
                        onPriority={() => handlePriority(word.id, word.is_priority || false)}
                        onDelete={() => handleDelete(word.id)}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </main>

      <WordEditModal 
        word={editingWord} 
        isOpen={editingWord !== null} 
        onClose={() => setEditingWord(null)} 
      />
    </div>
  );
}
