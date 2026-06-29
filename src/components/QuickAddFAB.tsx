'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/contexts/StoreContext';

export default function QuickAddFAB() {
  const { words, setWords } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newScene, setNewScene] = useState('');
  const [newExample, setNewExample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidatesModal, setCandidatesModal] = useState<{
    wordId: string;
    word: string;
    candidates: { scene: string; example: string; }[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    setIsSubmitting(true);
    const wordToSave = newWord.trim();
    const meaningToSave = newMeaning.trim() || 'AI generating...';
    const currentMeaning = newMeaning.trim();
    const currentScene = newScene.trim();
    const currentExample = newExample.trim();

    try {
      // 1. データベースに保存
      const { data, error } = await supabase
        .from('words')
        .insert([{ word: wordToSave, meaning: meaningToSave }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // グローバルステートに追加
        setWords(prev => [data, ...prev]);
        
        // モーダルを閉じる＆フォームリセット
        setIsOpen(false);
        setNewWord('');
        setNewMeaning('');
        setNewScene('');
        setNewExample('');

        // 2. AIによる意味・例文生成をバックグラウンドで実行
        handleGenerateAI(data.id, wordToSave, currentMeaning, currentScene, currentExample);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save word.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAI = async (id: string, targetWord: string, targetMeaning: string = '', targetScene: string = '', targetExample: string = '') => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord, meaning: targetMeaning, scene: targetScene, example: targetExample })
      });
      const data = await res.json();
      
      if (data.error) {
        console.error('AI error:', data.error);
        return;
      }

      // Update meaning immediately if it was generated
      if (data.meaning && data.meaning !== targetMeaning) {
        await supabase.from('words').update({ meaning: data.meaning }).eq('id', id);
        setWords(prev => prev.map(w => w.id === id ? { ...w, meaning: data.meaning } : w));
      }

      if (data.candidates && data.candidates.length > 0) {
        setCandidatesModal({
          wordId: id,
          word: targetWord,
          candidates: data.candidates
        });
      } else if (data.scene || data.example) {
        // Fallback for old API format
        const updateData: any = {};
        if (data.scene) updateData.scene = data.scene;
        if (data.example) updateData.example = data.example;

        const { error: updateError } = await supabase
          .from('words')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;
        setWords(prev => prev.map(w => w.id === id ? { ...w, ...updateData } : w));
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    }
  };

  const handleSelectCandidate = async (wordId: string, scene: string, example: string) => {
    try {
      const { error } = await supabase
        .from('words')
        .update({ scene, example })
        .eq('id', wordId);
      if (error) throw error;

      setWords(prev => prev.map(w => w.id === wordId ? { ...w, scene, example } : w));
      setCandidatesModal(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save candidate.');
    }
  };

  return (
    <>
      {/* 画面右下のフローティングアクションボタン (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#58A498] hover:bg-[#4A8F84] text-white rounded-full shadow-[0_6px_20px_rgba(88,164,152,0.4)] hover:shadow-[0_8px_24px_rgba(88,164,152,0.5)] flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-[0_2px_10px_rgba(88,164,152,0.4)] group"
        title="Quick Add Word"
      >
        <span className="material-symbols-rounded text-3xl group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
      </button>

      {/* 追加用モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm border-4 border-[#2D3748] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[#E0F2EF]/50">
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                <span className="material-symbols-rounded text-[#58A498]">note_add</span>
                Quick Memo
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-[#2D3748] text-[#2D3748] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">
                    Word <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder=""
                    className="w-full cute-input px-3 py-2 text-sm font-black text-[#2D3748] placeholder-gray-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">
                    Meaning
                  </label>
                  <input
                    type="text"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder=""
                    className="w-full cute-input px-3 py-2 text-sm font-semibold text-[#2D3748] placeholder-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">
                    Usage Scene
                  </label>
                  <input
                    type="text"
                    value={newScene}
                    onChange={(e) => setNewScene(e.target.value)}
                    placeholder=""
                    className="w-full cute-input px-3 py-2 text-sm font-semibold text-[#2D3748] placeholder-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">
                    Example Sentence
                  </label>
                  <input
                    type="text"
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    placeholder=""
                    className="w-full cute-input px-3 py-2 text-sm font-semibold text-[#2D3748] placeholder-gray-300"
                  />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D3748]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border-4 border-[#2D3748] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 shadow-[8px_8px_0px_0px_#2D3748]">
            <div className="px-5 py-4 border-b-2 border-dashed border-[#2D3748]/20 flex justify-between items-center bg-[#FEF08A]/30">
              <h3 className="font-black text-lg flex items-center gap-2 text-[#2D3748]">
                <span className="material-symbols-rounded text-[#2B6CB0]">psychology</span>
                Choose Example for "{candidatesModal.word}"
              </h3>
              <button 
                onClick={() => setCandidatesModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-[#2D3748] text-[#2D3748] hover:bg-gray-100 transition-colors active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm font-bold text-[#4A5568] mb-2">Select the scene and example that fits best:</p>
              {candidatesModal.candidates.map((candidate, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectCandidate(candidatesModal.wordId, candidate.scene, candidate.example)}
                  className="cute-card p-4 bg-white hover:bg-[#EBF8FF] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#2D3748] transition-all group border-2 border-[#E2E8F0] hover:border-[#2B6CB0]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex">
                      <span className="inline-flex text-left items-start gap-1.5 text-[12px] bg-[#E2E8F0] group-hover:bg-white border border-[#2D3748] text-[#2D3748] font-black px-2.5 py-1.5 rounded-lg shadow-[1px_1px_0px_0px_#2D3748]">
                        <span className="material-symbols-rounded text-[14px] shrink-0">lightbulb</span>
                        <span className="leading-relaxed break-words">{candidate.scene}</span>
                      </span>
                    </div>
                    <div className="text-[13px] text-[#2D3748] font-bold mt-1 leading-relaxed flex items-start gap-2">
                      <span className="text-[#2B6CB0] font-black shrink-0 mt-0.5">Ex:</span>
                      <span>{candidate.example.replace(/\n/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
