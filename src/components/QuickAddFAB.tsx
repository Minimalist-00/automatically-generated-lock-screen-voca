'use client';

import React, { useState } from 'react';
import { addWord, updateWord } from '@/app/actions/words';
import { useStore } from '@/contexts/StoreContext';
import PasteButton from '@/components/PasteButton';
import { toast } from 'sonner';

export default function QuickAddFAB() {
  const { words, setWords } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState('');
  const [newScene, setNewScene] = useState('');
  const [newExample, setNewExample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidatesModal, setCandidatesModal] = useState<{
    wordId: string;
    word: string;
    partOfSpeech?: string;
    candidates: { scene: string; example: string; }[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    // 重複チェック
    const normalizedWord = newWord.trim().toLowerCase();
    if (words.some(w => w.word.trim().toLowerCase() === normalizedWord)) {
      toast.error(`"${newWord.trim()}" is already registered.`);
      return;
    }

    setIsSubmitting(true);
    const wordToSave = newWord.trim();
    const meaningToSave = newMeaning.trim() || 'AI generating...';
    const currentMeaning = newMeaning.trim();
    const currentPartOfSpeech = newPartOfSpeech.trim();
    const currentScene = newScene.trim();
    const currentExample = newExample.trim();

    try {
      // 1. データベースに保存
      const data = await addWord({ 
        word: wordToSave, 
        meaning: meaningToSave, 
        part_of_speech: currentPartOfSpeech,
        scene: currentScene || null,
        example: currentExample || null
      });
      
      if (data) {
        // グローバルステートに追加
        setWords(prev => [data, ...prev]);
        
        // モーダルを閉じる＆フォームリセット
        setIsOpen(false);
        setNewWord('');
        setNewMeaning('');
        setNewPartOfSpeech('');
        setNewScene('');
        setNewExample('');

        // 2. AIによる意味・例文生成をバックグラウンドで実行
        handleGenerateAI(data.id, wordToSave, currentMeaning, currentScene, currentExample, currentPartOfSpeech);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save word.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAI = async (id: string, targetWord: string, targetMeaning: string = '', targetScene: string = '', targetExample: string = '', targetPartOfSpeech: string = '') => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord, meaning: targetMeaning, scene: targetScene, example: targetExample, part_of_speech: targetPartOfSpeech })
      });
      const data = await res.json();
      
      if (data.error) {
        console.error('AI error:', data.error);
        return;
      }

      // Update meaning and part of speech immediately if they were generated
      const updateFields: any = {};
      let shouldUpdate = false;

      if (data.meaning && data.meaning !== targetMeaning) {
        updateFields.meaning = data.meaning;
        shouldUpdate = true;
      }
      if (data.part_of_speech && data.part_of_speech !== targetPartOfSpeech) {
        updateFields.part_of_speech = data.part_of_speech;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await updateWord(id, updateFields);
        setWords(prev => prev.map(w => w.id === id ? { ...w, ...updateFields } : w));
      }

      const hasCustomSceneOrExample = targetScene.trim() !== '' || targetExample.trim() !== '';
      if (hasCustomSceneOrExample) {
        return;
      }

      if (data.candidates && data.candidates.length > 0) {
        setCandidatesModal({
          wordId: id,
          word: targetWord,
          partOfSpeech: data.part_of_speech,
          candidates: data.candidates
        });
      } else if (data.scene || data.example) {
        // Fallback for old API format
        const updateData: any = {};
        if (data.scene) updateData.scene = data.scene;
        if (data.example) updateData.example = data.example;

        await updateWord(id, updateData);
        setWords(prev => prev.map(w => w.id === id ? { ...w, ...updateData } : w));
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    }
  };

  const handleSelectCandidate = async (wordId: string, scene: string, example: string) => {
    try {
      await updateWord(wordId, { scene, example });
      setWords(prev => prev.map(w => w.id === wordId ? { ...w, scene, example } : w));
      setCandidatesModal(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save candidate.');
    }
  };

  return (
    <>
      {/* 画面右下のフローティングアクションボタン (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-[0_6px_20px_rgba(146,208,198,0.4)] hover:shadow-[0_8px_24px_rgba(146,208,198,0.5)] flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-[0_2px_10px_rgba(146,208,198,0.4)] group"
        title="Quick Add Word"
      >
        <span className="material-symbols-rounded text-3xl group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
      </button>

      {/* 追加用モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--border-main)]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-sm border-2 border-[var(--border-main)] overflow-hidden animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="px-5 py-4 border-b-2 border-dashed border-[var(--border-main)]/20 flex justify-between items-center bg-[var(--secondary)]/50">
              <h3 className="font-black text-lg flex items-center gap-2 text-[var(--text-main)]">
                <span className="material-symbols-rounded text-[var(--primary)]">note_add</span>
                Quick Memo
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card-bg)] border-2 border-[var(--border-main)] text-[var(--text-main)] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Word <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoFocus
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder=""
                      className="w-full cute-input pl-3 pr-10 py-2 text-sm font-black text-[var(--text-main)] placeholder-gray-300"
                      required
                    />
                    <PasteButton
                      onPaste={(text) => setNewWord(text)}
                      className="absolute right-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Meaning
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      placeholder=""
                      className="w-full cute-input pl-3 pr-10 py-2 text-sm font-semibold text-[var(--text-main)] placeholder-gray-300"
                    />
                    <PasteButton
                      onPaste={(text) => setNewMeaning(text)}
                      className="absolute right-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Part of Speech (e.g. Noun, Verb, Adj)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newPartOfSpeech}
                      onChange={(e) => setNewPartOfSpeech(e.target.value)}
                      placeholder=""
                      className="w-full cute-input pl-3 pr-10 py-2 text-sm font-semibold text-[var(--text-main)] placeholder-gray-300"
                    />
                    <PasteButton
                      onPaste={(text) => setNewPartOfSpeech(text)}
                      className="absolute right-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Usage Scene
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newScene}
                      onChange={(e) => setNewScene(e.target.value)}
                      placeholder=""
                      className="w-full cute-input pl-3 pr-10 py-2 text-sm font-semibold text-[var(--text-main)] placeholder-gray-300"
                    />
                    <PasteButton
                      onPaste={(text) => setNewScene(text)}
                      className="absolute right-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Example Sentence
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                      placeholder=""
                      className="w-full cute-input pl-3 pr-10 py-2 text-sm font-semibold text-[var(--text-main)] placeholder-gray-300"
                    />
                    <PasteButton
                      onPaste={(text) => setNewExample(text)}
                      className="absolute right-1"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-[#718096] font-semibold text-center">
                ※ 意味と例文は自動で生成されます✨
              </p>

              <button
                type="submit"
                disabled={isSubmitting || !newWord.trim()}
                className="w-full cute-btn py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-rounded animate-spin">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded">check</span>
                    Save Word
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Candidates Modal */}
      {candidatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--border-main)]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-2xl border-2 border-[var(--border-main)] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="px-5 py-4 border-b-2 border-dashed border-[var(--border-main)]/20 flex justify-between items-center bg-[var(--secondary)]/30">
              <h3 className="font-black text-lg flex items-center gap-2 text-[var(--text-main)] flex-wrap">
                <span className="material-symbols-rounded text-[var(--primary)]">psychology</span>
                <span>Choose Example for "{candidatesModal.word}"</span>
                {candidatesModal.partOfSpeech && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--secondary)]/70 text-[var(--foreground)] border border-[var(--primary)]/30">
                    {candidatesModal.partOfSpeech}
                  </span>
                )}
              </h3>
              <button 
                onClick={() => setCandidatesModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card-bg)] border-2 border-[var(--border-main)] text-[var(--text-main)] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm font-bold text-[var(--text-muted)] mb-2">Select the scene and example that fits best:</p>
              {candidatesModal.candidates.map((candidate, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectCandidate(candidatesModal.wordId, candidate.scene, candidate.example)}
                  className="cute-card p-4 bg-[var(--card-bg)] hover:bg-[var(--background)] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#2D3748] transition-all group border-2 border-[var(--border-light)] hover:border-[var(--primary)]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex mb-1">
                      <span className="inline-flex text-left items-center gap-1.5 text-[13px] text-[var(--text-muted)] font-bold">
                        <span className="material-symbols-rounded text-[16px] text-[#F6E05E]">lightbulb</span>
                        <span className="leading-relaxed break-words">{candidate.scene}</span>
                      </span>
                    </div>
                    <div className="text-[13px] text-[var(--text-main)] font-bold mt-1 leading-relaxed flex items-start gap-2">
                      <span className="text-[var(--primary)] font-black shrink-0 mt-0.5">Ex:</span>
                      <span className="whitespace-pre-wrap">{candidate.example}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-dashed border-[var(--border-main)]/20 mt-4">
                <button
                  onClick={() => handleSelectCandidate(candidatesModal.wordId, '', '')}
                  className="w-full cute-btn-secondary py-3 text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-rounded">bookmark_remove</span>
                  例文なしで保存する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
