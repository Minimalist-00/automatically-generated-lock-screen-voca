import React, { useState, useEffect } from 'react';
import { updateWord } from '@/app/actions/words';
import { useStore } from '@/contexts/StoreContext';
import { Word } from '@/types';
import PasteButton from '@/components/PasteButton';
import TagInput from '@/components/TagInput';
import { toast } from 'sonner';

interface WordEditModalProps {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WordEditModal({ word, isOpen, onClose }: WordEditModalProps) {
  const { words, setWords } = useStore();
  const [editWord, setEditWord] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive unique existing tags from the store
  const availableTags = Array.from(new Set((words || []).flatMap(w => w.tags || [])));

  useEffect(() => {
    if (word && isOpen) {
      setEditWord(word.word);
      setEditMemo(word.memo || '');
      setEditTags(word.tags || []);
    }
  }, [word, isOpen]);

  if (!isOpen || !word) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWord.trim()) return;

    setIsSubmitting(true);
    const wordToSave = editWord.trim();
    const memoToSave = editMemo.trim();

    try {
      const updated = await updateWord(word.id, {
        word: wordToSave,
        memo: memoToSave || null,
        tags: editTags,

      });
      
      if (updated) {
        setWords(prev => prev.map(w => w.id === word.id ? updated : w));
        toast.success('Word updated successfully.');
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update word.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background w-full max-w-lg rounded-[24px] shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 h-[520px] max-h-[90vh] flex flex-col relative">
        <div className="flex justify-between items-center px-5 py-4 border-b border-black/5 shrink-0 bg-white/60 backdrop-blur-md">
          <h2 className="text-lg font-bold text-foreground">Edit Word</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-black/5 rounded-full transition-colors"
          >
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-foreground/80">Word / Phrase / Sentence</label>
                  <PasteButton onPaste={(text) => setEditWord(text)} />
                </div>
                <input
                  type="text"
                  value={editWord}
                  onChange={(e) => setEditWord(e.target.value)}
                  className="cute-input w-full text-lg px-4 py-3"
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-1.5">Memo (Optional)</label>
                <textarea
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  className="cute-input w-full resize-none h-20 px-4 py-3"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-1.5">Tags</label>
                <TagInput 
                  tags={editTags} 
                  onChange={setEditTags} 
                  availableTags={availableTags}
                  disabled={isSubmitting} 
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3 items-center mt-auto shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-bold text-foreground/50 hover:text-foreground px-4 py-2 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cute-btn flex items-center justify-center min-w-[120px] shadow-sm py-2.5"
                disabled={isSubmitting || !editWord.trim()}
              >
                {isSubmitting ? (
                  <span className="material-symbols-rounded animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-rounded mr-1.5 text-[20px]">save</span>
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
