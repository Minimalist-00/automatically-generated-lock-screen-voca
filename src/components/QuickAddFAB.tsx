'use client';

import React, { useState } from 'react';
import { addWord, updateWord } from '@/app/actions/words';
import { useStore } from '@/contexts/StoreContext';
import PasteButton from '@/components/PasteButton';
import TagInput from '@/components/TagInput';
import { toast } from 'sonner';

export default function QuickAddFAB() {
  const { words, setWords } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');

  // Derive unique existing tags from the store
  const availableTags = Array.from(new Set(words.flatMap(w => w.tags || [])));

  // Single Mode State
  const [newWord, setNewWord] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  
  // Multi Mode State
  const [multiText, setMultiText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClassifyPOS = async (id: string, targetWord: string) => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord })
      });
      const data = await res.json();
      
      if (data.error) {
        console.error('AI error:', data.error);
        return;
      }

      if (data.part_of_speech) {
        const updated = await updateWord(id, { part_of_speech: data.part_of_speech });
        setWords(prev => prev.map(w => w.id === id ? updated : w));
      }
    } catch (err) {
      console.error('Failed to classify:', err);
    }
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    const normalizedWord = newWord.trim().toLowerCase();
    if (words.some(w => w.word.trim().toLowerCase() === normalizedWord)) {
      toast.error(`"${newWord.trim()}" is already registered.`);
      return;
    }

    setIsSubmitting(true);
    const wordToSave = newWord.trim();
    const memoToSave = newMemo.trim();
    const tagsArray = newTags;

    const tempId = `temp-${Date.now()}`;
    const tempWord = {
      id: tempId,
      word: wordToSave,
      memo: memoToSave || undefined,
      tags: tagsArray,
      part_of_speech: 'Classifying...',
      created_at: new Date().toISOString(),
      is_archived: false,
      is_priority: false,
    };

    setWords(prev => [tempWord, ...prev]);

    setIsOpen(false);
    setNewWord('');
    setNewMemo('');
    setNewTags([]);

    try {
      const data = await addWord({ 
        word: wordToSave, 
        memo: memoToSave || null,
        tags: tagsArray,
      });
      
      if (data) {
        setWords(prev => prev.map(w => w.id === tempId ? data : w));
        handleClassifyPOS(data.id, wordToSave);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save word.');
      setWords(prev => prev.filter(w => w.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMulti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiText.trim()) return;

    setIsSubmitting(true);

    const tagsArray = newTags;

    try {
      const res = await fetch('/api/gemini/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: multiText })
      });
      const data = await res.json();

      if (data.error || !data.parsedWords) {
        toast.error('Failed to parse text.');
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      setMultiText('');
      setNewTags([]);

      const parsedWords = data.parsedWords;
      for (const item of parsedWords) {
        const normalized = item.word.toLowerCase();
        if (words.some(w => w.word.trim().toLowerCase() === normalized)) {
          continue; // skip existing
        }

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempWord = {
          id: tempId,
          word: item.word,
          memo: item.memo || undefined,
          tags: tagsArray,
          part_of_speech: item.part_of_speech || 'Unknown',
          created_at: new Date().toISOString(),
          is_archived: false,
          is_priority: false,
        };

        setWords(prev => [tempWord, ...prev]);

        const savedData = await addWord({
          word: item.word,
          memo: item.memo || null,
          tags: tagsArray,
          part_of_speech: item.part_of_speech,
        });

        if (savedData) {
          if (item.part_of_speech) {
            await updateWord(savedData.id, { part_of_speech: item.part_of_speech });
            setWords(prev => prev.map(w => w.id === tempId ? { ...savedData, part_of_speech: item.part_of_speech } : w));
          } else {
            setWords(prev => prev.map(w => w.id === tempId ? savedData : w));
          }
        }
      }
      toast.success('Successfully added words!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to process multi-add.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover flex items-center justify-center transition-transform hover:scale-105 z-40"
        aria-label="Quick Add"
      >
        <span className="material-symbols-rounded text-3xl">add</span>
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start pt-12 sm:pt-0 sm:items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="bg-background w-full max-w-lg rounded-[24px] shadow-xl overflow-hidden animate-in slide-in-from-top-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 h-[600px] max-h-[85vh] flex flex-col relative">
        <div className="flex justify-between items-center px-5 py-4 border-b border-black/5 shrink-0 bg-white/60 backdrop-blur-md">
          <div className="flex gap-2 bg-black/5 p-1 rounded-xl">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'single' ? 'bg-white shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Single
            </button>
            <button
              onClick={() => setMode('multi')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mode === 'multi' ? 'bg-white shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground'}`}
            >
              Multi Magic
            </button>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-black/5 rounded-full transition-colors"
          >
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col">
          {mode === 'single' ? (
            <form onSubmit={handleSubmitSingle} className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-bold text-foreground/80">Word / Phrase / Sentence</label>
                    <PasteButton onPaste={(text) => setNewWord(text)} />
                  </div>
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="cute-input w-full text-lg px-4 py-3"
                    required
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground/80 mb-1.5">Memo (Optional)</label>
                  <textarea
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    className="cute-input w-full resize-none h-32 px-4 py-3"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground/80 mb-1.5">Tags</label>
                  <TagInput
                    tags={newTags}
                    onChange={setNewTags}
                    availableTags={availableTags}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 items-center mt-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold text-foreground/50 hover:text-foreground px-4 py-2 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cute-btn flex items-center justify-center min-w-[120px] shadow-sm py-2.5"
                  disabled={isSubmitting || !newWord.trim()}
                >
                  {isSubmitting ? (
                    <span className="material-symbols-rounded animate-spin">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-rounded mr-1.5 text-[20px]">add</span>
                      Add
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitMulti} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-bold text-foreground/80">Magic Note Dump</label>
                    <PasteButton onPaste={(text) => setMultiText(text)} />
                  </div>
                  <textarea
                    value={multiText}
                    onChange={(e) => setMultiText(e.target.value)}
                    className="cute-input w-full resize-none flex-1 px-4 py-3 min-h-[150px]"
                    required
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground/80 mb-1.5">Tags to Apply</label>
                  <TagInput
                    tags={newTags}
                    onChange={setNewTags}
                    availableTags={availableTags}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 items-center mt-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold text-foreground/50 hover:text-foreground px-4 py-2 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cute-btn flex items-center justify-center min-w-[140px] shadow-sm py-2.5 bg-gradient-to-r from-primary to-primary-hover border-none"
                  disabled={isSubmitting || !multiText.trim()}
                >
                  {isSubmitting ? (
                    <span className="material-symbols-rounded animate-spin">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-rounded mr-1.5 text-[20px]">auto_awesome</span>
                      Magic Add
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
